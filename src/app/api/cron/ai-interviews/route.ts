import { NextRequest, NextResponse } from 'next/server'
import { AiInterviewStatus, RecordingStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'

const DAILY_API_KEY = process.env.DAILY_API_KEY
const DAILY_DOMAIN = process.env.DAILY_DOMAIN
const PIPECAT_API_KEY =
  process.env.PIPECAT_PUBLIC_API_KEY ||
  process.env.PIPECAT_PRIVATE_API_KEY ||
  process.env.PIPECAT_API_KEY ||
  process.env.PIPECAT_PRIVATE_KEY
const PIPECAT_AGENT_NAME = process.env.PIPECAT_AGENT_NAME
const PIPECAT_BASE_URL = process.env.PIPECAT_BASE_URL || 'https://api.pipecat.daily.co/v1/public'
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY
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

const startPipecatSession = async (
  call: {
    id: string
    durationMinutes: number
    aiQuestions: any
  },
  room: { name: string | null; url: string | null }
) => {
  if (!PIPECAT_API_KEY) {
    throw new Error('Pipecat Cloud API key is not configured')
  }

  if (!PIPECAT_AGENT_NAME) {
    throw new Error('Pipecat agent name is not configured')
  }

  const roomRef = room.url || room.name
  if (!roomRef) {
    throw new Error('Daily room is not ready')
  }

  const questionList: Array<{ text: string; language?: string; voiceId?: string | null }> = Array.isArray(
    call.aiQuestions
  )
    ? call.aiQuestions
    : []

  const firstQuestion = questionList[0]
  const fallbackVoiceId =
    firstQuestion?.language === 'ar'
      ? process.env.ELEVENLABS_VOICE_ID_AR || null
      : process.env.ELEVENLABS_VOICE_ID_EN || null

  const script = questionList.map((q, idx) => `${idx + 1}. ${q.text}`).join('\n')

  const maxDuration = Math.max(120, call.durationMinutes * 60 + 120)

  const payload = {
    createDailyRoom: false,
    transport: 'daily',
    body: {
      roomUrl: room.url || roomRef,
      roomName: room.name || undefined,
      maxDurationSeconds: maxDuration,
      questions: questionList,
      script,
      language: firstQuestion?.language || 'en',
      voiceId: firstQuestion?.voiceId || fallbackVoiceId,
      allowBargeIn: true,
      maxSilenceSeconds: 8,
      maxRetries: 2,
      elevenlabsApiKey: ELEVENLABS_API_KEY || undefined,
      deepgramApiKey: DEEPGRAM_API_KEY || undefined,
    },
  }

  const baseUrl = PIPECAT_BASE_URL.replace(/\/$/, '')
  const res = await fetch(`${baseUrl}/${encodeURIComponent(PIPECAT_AGENT_NAME)}/start`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PIPECAT_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to start Pipecat session')
  }
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

        try {
          await startPipecatSession(call, { name: roomName, url: roomUrl })
        } catch (botError) {
          errors.push({
            id: call.id,
            error: botError instanceof Error ? botError.message : 'Failed to start bot',
          })
          await prisma.callSession.update({
            where: { id: call.id },
            data: { aiInterviewStatus: AiInterviewStatus.FAILED },
          })
        }

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
          call.candidateJoinedAt || call.userJoinedAt ? AiInterviewStatus.COMPLETED : AiInterviewStatus.NO_SHOW

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
