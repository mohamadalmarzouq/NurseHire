import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const candidateIdParam = searchParams.get('candidateId')
    const requestIdParam = searchParams.get('requestId')

    let whereClause: any = {}
    if (payload.role === 'USER') {
      whereClause = { userId: payload.id }
      if (candidateIdParam) {
        whereClause.candidateId = candidateIdParam
      }
      if (requestIdParam) {
        whereClause.requestId = requestIdParam
      }
    } else if (payload.role === 'CANDIDATE') {
      whereClause = { candidateId: payload.id }
      if (requestIdParam) {
        whereClause.requestId = requestIdParam
      }
    } else {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const calls = await prisma.callSession.findMany({
      where: whereClause,
      include: {
        request: true,
        user: { include: { userProfile: true } },
        candidate: { include: { candidateProfile: true } },
      },
      orderBy: { scheduledAt: 'desc' },
    })

    return NextResponse.json({ calls })
  } catch (error) {
    console.error('Error fetching calls:', error)
    return NextResponse.json({ error: 'Failed to fetch calls' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'USER') {
      return NextResponse.json({ error: 'User access required' }, { status: 403 })
    }

    const body = await request.json()
    const {
      requestId,
      candidateId,
      scheduledAt,
      durationMinutes,
      timezone,
      aiInterviewEnabled,
      aiQuestions,
    } = body

    if (!scheduledAt || !durationMinutes || !timezone || (!requestId && !candidateId)) {
      return NextResponse.json(
        { error: 'candidateId or requestId, scheduledAt, durationMinutes, and timezone are required' },
        { status: 400 }
      )
    }

    const enableAiInterview = Boolean(aiInterviewEnabled)
    const questionItems: string[] = Array.isArray(aiQuestions)
      ? aiQuestions.map((q: any) => String(q || '').trim()).filter(Boolean)
      : []

    if (enableAiInterview && questionItems.length === 0) {
      return NextResponse.json(
        { error: 'At least one interview question is required for AI calls' },
        { status: 400 }
      )
    }

    if (questionItems.length > 12) {
      return NextResponse.json({ error: 'Maximum 12 questions allowed' }, { status: 400 })
    }

    const scheduledDate = new Date(scheduledAt)
    if (Number.isNaN(scheduledDate.getTime())) {
      return NextResponse.json({ error: 'Invalid scheduledAt value' }, { status: 400 })
    }

    if (scheduledDate.getTime() < Date.now()) {
      return NextResponse.json({ error: 'Scheduled time must be in the future' }, { status: 400 })
    }

    const durationValue = Number(durationMinutes)
    if (!Number.isFinite(durationValue) || durationValue <= 0) {
      return NextResponse.json({ error: 'Invalid durationMinutes value' }, { status: 400 })
    }

    let resolvedCandidateId = candidateId
    let resolvedRequestId = requestId || null

    if (requestId) {
      const infoRequest = await prisma.informationRequest.findFirst({
        where: {
          id: requestId,
          requesterId: payload.id,
        },
      })

      if (!infoRequest) {
        return NextResponse.json({ error: 'Request not found' }, { status: 404 })
      }

      if (infoRequest.status === 'CANCELLED') {
        return NextResponse.json(
          { error: 'Cannot schedule a call for a cancelled request' },
          { status: 400 }
        )
      }

      resolvedCandidateId = infoRequest.candidateId
      resolvedRequestId = infoRequest.id
    }

    if (!resolvedCandidateId) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
    }

    const candidate = await prisma.user.findFirst({
      where: { id: resolvedCandidateId, role: 'CANDIDATE' },
      include: { candidateProfile: true },
    })

    if (!candidate || !candidate.candidateProfile || candidate.candidateProfile.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Candidate not found or not approved' }, { status: 404 })
    }

    const existingCall = await prisma.callSession.findFirst({
      where: {
        status: { in: ['REQUESTED', 'ACCEPTED'] },
        ...(resolvedRequestId
          ? { requestId: resolvedRequestId }
          : { userId: payload.id, candidateId: resolvedCandidateId }),
      },
      orderBy: { scheduledAt: 'desc' },
    })

    if (existingCall) {
      return NextResponse.json(
        { error: 'There is already a pending or accepted call for this candidate' },
        { status: 400 }
      )
    }

    const detectArabic = (text: string) => /[\u0600-\u06FF]/.test(text)
    const voiceIdEn = process.env.ELEVENLABS_VOICE_ID_EN || null
    const voiceIdAr = process.env.ELEVENLABS_VOICE_ID_AR || null
    const aiQuestionsPayload = enableAiInterview
      ? questionItems.map((text: string) => {
          const language = detectArabic(text) ? 'ar' : 'en'
          const voiceId = language === 'ar' ? voiceIdAr : voiceIdEn
          return { text, language, voiceId }
        })
      : Prisma.JsonNull

    const call = await prisma.callSession.create({
      data: {
        requestId: resolvedRequestId,
        userId: payload.id,
        candidateId: resolvedCandidateId,
        scheduledAt: scheduledDate,
        durationMinutes: durationValue,
        timezone,
        status: 'REQUESTED',
        aiInterviewEnabled: enableAiInterview,
        aiInterviewStatus: enableAiInterview ? 'SCHEDULED' : null,
        aiQuestions: aiQuestionsPayload,
      },
      include: {
        request: true,
        user: { include: { userProfile: true } },
        candidate: { include: { candidateProfile: true } },
      },
    })

    return NextResponse.json({ call })
  } catch (error) {
    console.error('Error creating call:', error)
    return NextResponse.json({ error: 'Failed to create call' }, { status: 500 })
  }
}
