import { NextRequest, NextResponse } from 'next/server'
import { AiInterviewStatus, RecordingStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { uploadToCloudinary } from '@/lib/cloudinary'

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

const isParticipantJoinedEvent = (event?: string) => {
  if (!event) return false
  const normalized = event.toLowerCase()
  return normalized.includes('participant') && normalized.includes('joined')
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const event = body?.event || body?.type
    const payload = body?.payload || body

    if (isParticipantJoinedEvent(event)) {
      const roomName = payload?.room_name || payload?.room
      if (!roomName) {
        return NextResponse.json({ ok: true })
      }

      const call = await prisma.callSession.findFirst({
        where: {
          dailyRoomName: roomName,
          aiInterviewEnabled: true,
        },
      })

      if (!call || call.status !== 'ACCEPTED' || call.aiInterviewStatus !== AiInterviewStatus.SCHEDULED) {
        return NextResponse.json({ ok: true })
      }

      const roomUrl =
        call.dailyRoomUrl || (DAILY_DOMAIN && roomName ? `https://${DAILY_DOMAIN}/${roomName}` : null)

      const started = await prisma.callSession.updateMany({
        where: {
          id: call.id,
          aiInterviewStatus: AiInterviewStatus.SCHEDULED,
        },
        data: {
          aiInterviewStatus: AiInterviewStatus.RUNNING,
          startedAt: call.startedAt || new Date(),
          dailyRoomName: call.dailyRoomName || roomName,
          dailyRoomUrl: call.dailyRoomUrl || roomUrl,
        },
      })

      if (started.count === 0) {
        return NextResponse.json({ ok: true })
      }

      try {
        if (call.recordingStatus !== RecordingStatus.RECORDING && roomName) {
          const recordingId = await startDailyRecording(roomName)
          await prisma.callSession.update({
            where: { id: call.id },
            data: {
              recordingStatus: RecordingStatus.RECORDING,
              dailyRecordingId: recordingId,
            },
          })
        }

        await startPipecatSession(call, { name: roomName, url: roomUrl })
      } catch (error) {
        await prisma.callSession.update({
          where: { id: call.id },
          data: { aiInterviewStatus: AiInterviewStatus.FAILED },
        })
        console.error('Daily webhook AI start error:', error)
      }

      return NextResponse.json({ ok: true })
    }

    if (event !== 'recording.ready-to-download' && payload?.status !== 'finished') {
      return NextResponse.json({ ok: true })
    }

    const recordingId = payload?.recording_id
    const roomName = payload?.room_name || payload?.room

    if (!recordingId || !DAILY_API_KEY) {
      return NextResponse.json({ error: 'Missing recording info' }, { status: 400 })
    }

    const linkRes = await fetch(
      `https://api.daily.co/v1/recordings/${recordingId}/access-link`,
      {
        headers: { Authorization: `Bearer ${DAILY_API_KEY}` },
      }
    )

    if (!linkRes.ok) {
      const errData = await linkRes.json().catch(() => ({}))
      return NextResponse.json(
        { error: errData.error || 'Failed to fetch recording link' },
        { status: 500 }
      )
    }

    const linkData = await linkRes.json()
    const downloadUrl = linkData.download_link
    if (!downloadUrl) {
      return NextResponse.json({ error: 'Download link missing' }, { status: 500 })
    }

    const recordingRes = await fetch(downloadUrl)
    if (!recordingRes.ok) {
      return NextResponse.json({ error: 'Failed to download recording' }, { status: 500 })
    }

    const buffer = Buffer.from(await recordingRes.arrayBuffer())
    const upload = await uploadToCloudinary(
      buffer,
      'call-recordings',
      `${recordingId}.mp4`,
      'video'
    )

    const updateData = {
      recordingStatus: RecordingStatus.READY,
      recordingUrl: upload.secureUrl,
      recordingDurationSeconds: payload?.duration || null,
      dailyRecordingId: recordingId,
    }

    let updated = await prisma.callSession.updateMany({
      where: { dailyRecordingId: recordingId },
      data: updateData,
    })

    if (updated.count === 0 && roomName) {
      updated = await prisma.callSession.updateMany({
        where: { dailyRoomName: roomName },
        data: updateData,
      })
    }

    if (updated.count === 0) {
      return NextResponse.json({ error: 'Call session not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Daily webhook error:', error)
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 })
  }
}
