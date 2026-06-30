import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { uploadToCloudinary } from '@/lib/cloudinary'

const fetchConversationAudio = async (conversationId: string, apiKey: string) => {
  let lastStatus: number | null = null

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const audioResponse = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/audio`,
      {
        headers: { 'xi-api-key': apiKey },
      }
    )

    lastStatus = audioResponse.status
    if (audioResponse.ok) {
      return { buffer: Buffer.from(await audioResponse.arrayBuffer()), status: audioResponse.status }
    }

    if (audioResponse.status !== 404 && audioResponse.status !== 409 && audioResponse.status !== 425) {
      break
    }

    await new Promise((resolve) => setTimeout(resolve, 1200 * attempt))
  }

  return { buffer: null, status: lastStatus }
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
    if (!payload || payload.role !== 'CANDIDATE') {
      return NextResponse.json({ error: 'Candidate access required' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const transcript = typeof body?.transcript === 'string' ? body.transcript : null
    const conversationId = typeof body?.conversationId === 'string' ? body.conversationId : null

    const interview = await prisma.aiInterview.findFirst({
      where: { id, candidateId: payload.id },
    })

    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
    }

    const session = await prisma.aiInterviewSession.findFirst({
      where: { interviewId: id, candidateId: payload.id },
      orderBy: { createdAt: 'desc' },
    })

    if (!session) {
      return NextResponse.json({ error: 'Interview session not found' }, { status: 404 })
    }

    let recordingUrl: string | null = null
    let recordingPublicId: string | null = null
    let recordingStatus: 'READY' | 'FAILED' = 'FAILED'
    let recordingError: string | null = null

    console.info('AI interview finalize started', {
      interviewId: id,
      sessionId: session.id,
      candidateId: payload.id,
      conversationId: conversationId ?? 'missing',
    })

    const apiKey = process.env.ELEVENLABS_API_KEY
    if (apiKey && conversationId) {
      const { buffer: audioBuffer, status } = await fetchConversationAudio(conversationId, apiKey)
      if (audioBuffer) {
        const fileName = `ai-interview-${id}-${session.id}.mp3`
        const upload = await uploadToCloudinary(
          audioBuffer,
          'ai-interview-recordings',
          fileName,
          'video'
        )
        recordingUrl = upload.secureUrl
        recordingPublicId = upload.publicId
        recordingStatus = 'READY'
        console.info('AI interview recording uploaded', {
          interviewId: id,
          sessionId: session.id,
          recordingPublicId,
        })
      } else {
        recordingError = `Audio fetch failed (${status ?? 'unknown'})`
        console.warn('AI interview audio fetch failed', {
          interviewId: id,
          sessionId: session.id,
          status: status ?? 'unknown',
        })
      }
    } else {
      recordingError = apiKey ? 'Missing conversation ID' : 'Missing ElevenLabs API key'
      console.warn('AI interview recording skipped', {
        interviewId: id,
        sessionId: session.id,
        reason: recordingError,
      })
    }

    const updatedSession = await prisma.aiInterviewSession.update({
      where: { id: session.id },
      data: {
        status: 'COMPLETED',
        endedAt: new Date(),
        transcript: transcript || session.transcript,
        recordingUrl,
        recordingPublicId,
        recordingStatus,
      },
    })

    await prisma.aiInterview.update({
      where: { id },
      data: { status: 'COMPLETED' },
    })

    return NextResponse.json({
      session: updatedSession,
      recordingError,
    })
  } catch (error) {
    console.error('Error finalizing AI interview:', error)
    return NextResponse.json({ error: 'Failed to finalize AI interview' }, { status: 500 })
  }
}
