import { NextRequest, NextResponse } from 'next/server'
import { AiInterviewStatus, RecordingStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'

const DAILY_API_KEY = process.env.DAILY_API_KEY
const DAILY_DOMAIN = process.env.DAILY_DOMAIN
const CRON_SECRET = process.env.CRON_SECRET

const MAX_LOOKBACK_MS = 6 * 60 * 60 * 1000
const END_BUFFER_MS = 60 * 1000

const isAuthorized = (request: NextRequest) => {
  if (!CRON_SECRET) return false
  const authHeader = request.headers.get('authorization')
  const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  const directToken = request.headers.get('x-cron-secret')
  return headerToken === CRON_SECRET || directToken === CRON_SECRET
}

const ensureDailyRoom = async (callId: string, existingName?: string | null, existingUrl?: string | null) => {
  if (existingName && existingUrl) {
    return { roomName: existingName, roomUrl: existingUrl }
  }

  if (!DAILY_API_KEY || !DAILY_DOMAIN) {
    throw new Error('Daily is not configured')
  }

  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 2
  const createRoomRes = await fetch('https://api.daily.co/v1/rooms', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${DAILY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: `call-${callId}`,
      privacy: 'private',
      properties: {
        exp: expiresAt,
        enable_chat: true,
      },
    }),
  })

  if (!createRoomRes.ok) {
    const errorData = await createRoomRes.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to create Daily room')
  }

  const roomData = await createRoomRes.json()
  return { roomName: roomData.name, roomUrl: roomData.url }
}

const startDailyRecording = async (roomName: string) => {
  if (!DAILY_API_KEY) {
    throw new Error('Daily is not configured')
  }

  const res = await fetch(`https://api.daily.co/v1/rooms/${roomName}/recordings/start`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${DAILY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type: 'cloud' }),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to start recording')
  }

  const data = await res.json()
  return data?.recording_id || data?.id || null
}

const stopDailyRecording = async (roomName: string) => {
  if (!DAILY_API_KEY) {
    throw new Error('Daily is not configured')
  }

  const res = await fetch(`https://api.daily.co/v1/rooms/${roomName}/recordings/stop`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${DAILY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to stop recording')
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const lookbackStart = new Date(now.getTime() - MAX_LOOKBACK_MS)

    const startCandidates = await prisma.callSession.findMany({
      where: {
        aiInterviewEnabled: true,
        aiInterviewStatus: AiInterviewStatus.SCHEDULED,
        status: 'ACCEPTED',
        scheduledAt: {
          lte: now,
          gte: lookbackStart,
        },
      },
    })

    const endCandidates = await prisma.callSession.findMany({
      where: {
        aiInterviewEnabled: true,
        aiInterviewStatus: AiInterviewStatus.RUNNING,
        status: 'ACCEPTED',
        scheduledAt: {
          lte: now,
        },
      },
    })

    const started: string[] = []
    const ended: string[] = []
    const errors: Array<{ id: string; error: string }> = []

    for (const call of startCandidates) {
      try {
        const { roomName, roomUrl } = await ensureDailyRoom(
          call.id,
          call.dailyRoomName,
          call.dailyRoomUrl
        )

        const updateData: any = {
          dailyRoomName: roomName,
          dailyRoomUrl: roomUrl,
          aiInterviewStatus: AiInterviewStatus.RUNNING,
          startedAt: call.startedAt || new Date(),
        }

        if (call.recordingStatus !== RecordingStatus.RECORDING) {
          const recordingId = await startDailyRecording(roomName)
          updateData.recordingStatus = RecordingStatus.RECORDING
          updateData.dailyRecordingId = recordingId
        }

        await prisma.callSession.update({
          where: { id: call.id },
          data: updateData,
        })

        started.push(call.id)
      } catch (error) {
        errors.push({ id: call.id, error: error instanceof Error ? error.message : 'Unknown error' })
      }
    }

    for (const call of endCandidates) {
      const scheduledEnd = new Date(
        call.scheduledAt.getTime() + call.durationMinutes * 60 * 1000 + END_BUFFER_MS
      )
      if (now < scheduledEnd) continue

      try {
        if (call.dailyRoomName && call.recordingStatus === RecordingStatus.RECORDING) {
          await stopDailyRecording(call.dailyRoomName)
        }

        const nextStatus =
          call.caretakerJoinedAt || call.userJoinedAt ? AiInterviewStatus.COMPLETED : AiInterviewStatus.NO_SHOW

        await prisma.callSession.update({
          where: { id: call.id },
          data: {
            aiInterviewStatus: nextStatus,
            recordingStatus:
              call.recordingStatus === RecordingStatus.RECORDING
                ? RecordingStatus.PROCESSING
                : call.recordingStatus,
            endedAt: new Date(),
            status: 'COMPLETED',
          },
        })

        ended.push(call.id)
      } catch (error) {
        errors.push({ id: call.id, error: error instanceof Error ? error.message : 'Unknown error' })
      }
    }

    return NextResponse.json({
      startedCount: started.length,
      endedCount: ended.length,
      errors,
    })
  } catch (error) {
    console.error('Error running AI interview cron:', error)
    return NextResponse.json({ error: 'Failed to run AI interview cron' }, { status: 500 })
  }
}
