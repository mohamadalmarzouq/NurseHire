import { NextRequest, NextResponse } from 'next/server'
import { AiInterviewStatus, CallStatus, Prisma, RecordingStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

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
  const startUrl = `${baseUrl}/${encodeURIComponent(PIPECAT_AGENT_NAME)}/start`
  console.info('Pipecat start request', {
    baseUrl,
    agentName: PIPECAT_AGENT_NAME,
    startUrl,
  })
  const res = await fetch(startUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PIPECAT_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    console.error('Pipecat start failed:', { status: res.status, error: errorData })
    throw new Error(errorData.error || 'Failed to start Pipecat session')
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    if (!DAILY_API_KEY || !DAILY_DOMAIN) {
      return NextResponse.json({ error: 'Daily is not configured' }, { status: 500 })
    }

    const { id } = await params
    const callSession = await prisma.callSession.findFirst({
      where: {
        id,
        OR: [{ userId: payload.id }, { caretakerId: payload.id }],
      },
      include: {
        user: { include: { userProfile: true } },
        caretaker: { include: { caretakerProfile: true } },
      },
    })

    if (!callSession) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 })
    }

    if (!['ACCEPTED', 'REQUESTED'].includes(callSession.status)) {
      return NextResponse.json({ error: 'Call is not active' }, { status: 400 })
    }

    let roomName = callSession.dailyRoomName
    let roomUrl = callSession.dailyRoomUrl

    if (!roomName || !roomUrl) {
      const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 2
      const createRoomRes = await fetch('https://api.daily.co/v1/rooms', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${DAILY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `call-${callSession.id}`,
          privacy: 'private',
          properties: {
            exp: expiresAt,
            enable_chat: true,
          },
        }),
      })

      if (!createRoomRes.ok) {
        const errorData = await createRoomRes.json().catch(() => ({}))
        return NextResponse.json(
          { error: errorData.error || 'Failed to create Daily room' },
          { status: 500 }
        )
      }

      const roomData = await createRoomRes.json()
      roomName = roomData.name
      roomUrl = roomData.url

      await prisma.callSession.update({
        where: { id: callSession.id },
        data: {
          dailyRoomName: roomName,
          dailyRoomUrl: roomUrl,
          startedAt: callSession.startedAt || new Date(),
          status: callSession.status === 'REQUESTED' ? 'ACCEPTED' : callSession.status,
        },
      })
    }

    const joinData: Prisma.CallSessionUpdateInput = {}
    if (payload.role === 'CARETAKER' && !callSession.caretakerJoinedAt) {
      joinData.caretakerJoinedAt = new Date()
    }
    if (payload.role !== 'CARETAKER' && !callSession.userJoinedAt) {
      joinData.userJoinedAt = new Date()
    }
    if (!callSession.startedAt) {
      joinData.startedAt = new Date()
    }
    const userJoined = callSession.userJoinedAt || joinData.userJoinedAt
    const caretakerJoined = callSession.caretakerJoinedAt || joinData.caretakerJoinedAt
    if (userJoined && caretakerJoined && !callSession.callActivatedAt) {
      joinData.callActivatedAt = new Date()
      joinData.userLeftAt = null
      joinData.caretakerLeftAt = null
    }
    if (payload.role === 'CARETAKER' && callSession.status === 'REQUESTED') {
      joinData.status = CallStatus.ACCEPTED
    }
    if (callSession.aiInterviewEnabled && !callSession.aiInterviewStatus) {
      joinData.aiInterviewStatus = AiInterviewStatus.SCHEDULED
    }
    if (Object.keys(joinData).length > 0) {
      await prisma.callSession.update({
        where: { id: callSession.id },
        data: joinData,
      })
    }

    if (payload.role === 'CARETAKER' && callSession.aiInterviewEnabled) {
      console.info('AI interview join detected', {
        callId: callSession.id,
        status: callSession.status,
        aiInterviewStatus: callSession.aiInterviewStatus,
        roomName,
      })
      const refreshed = await prisma.callSession.findUnique({ where: { id: callSession.id } })
      if (
        refreshed &&
        refreshed.status === 'ACCEPTED' &&
        refreshed.aiInterviewStatus === AiInterviewStatus.SCHEDULED
      ) {
        console.info('Starting AI interview on join', {
          callId: refreshed.id,
          roomName: refreshed.dailyRoomName || roomName,
        })
        const roomForCall = {
          name: refreshed.dailyRoomName || roomName,
          url:
            refreshed.dailyRoomUrl ||
            (DAILY_DOMAIN && (refreshed.dailyRoomName || roomName)
              ? `https://${DAILY_DOMAIN}/${refreshed.dailyRoomName || roomName}`
              : null),
        }

        const marked = await prisma.callSession.updateMany({
          where: {
            id: refreshed.id,
            aiInterviewStatus: AiInterviewStatus.SCHEDULED,
          },
          data: {
            aiInterviewStatus: AiInterviewStatus.RUNNING,
            startedAt: refreshed.startedAt || new Date(),
          },
        })

        if (marked.count > 0) {
          try {
            if (
              refreshed.recordingStatus !== RecordingStatus.RECORDING &&
              roomForCall.name
            ) {
              const recordingId = await startDailyRecording(roomForCall.name)
              await prisma.callSession.update({
                where: { id: refreshed.id },
                data: {
                  recordingStatus: RecordingStatus.RECORDING,
                  dailyRecordingId: recordingId,
                },
              })
            }

            await startPipecatSession(refreshed, roomForCall)
          } catch (error) {
            await prisma.callSession.update({
              where: { id: refreshed.id },
              data: { aiInterviewStatus: AiInterviewStatus.FAILED },
            })
            console.error('AI interview start-on-join error:', error)
          }
        }
      }
    }

    const displayName =
      callSession.userId === payload.id
        ? callSession.user.userProfile?.name || 'User'
        : callSession.caretaker.caretakerProfile?.name || 'Care Taker'

    const tokenRes = await fetch('https://api.daily.co/v1/meeting-tokens', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          room_name: roomName,
          user_name: displayName,
        },
      }),
    })

    if (!tokenRes.ok) {
      const errorData = await tokenRes.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.error || 'Failed to create meeting token' },
        { status: 500 }
      )
    }

    const tokenData = await tokenRes.json()

    const responsePayload: Record<string, unknown> = {
      roomUrl,
      token: tokenData.token,
      roomName,
    }

    if (payload.role === 'USER') {
      responsePayload.recordingStatus = callSession.recordingStatus
      responsePayload.recordingUrl = callSession.recordingUrl
    }

    return NextResponse.json(responsePayload)
  } catch (error) {
    console.error('Error joining call:', error)
    return NextResponse.json({ error: 'Failed to join call' }, { status: 500 })
  }
}
