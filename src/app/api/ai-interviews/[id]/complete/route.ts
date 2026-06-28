import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

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

    const updatedSession = await prisma.aiInterviewSession.update({
      where: { id: session.id },
      data: {
        status: 'COMPLETED',
        endedAt: new Date(),
        transcript: transcript || session.transcript,
      },
    })

    await prisma.aiInterview.update({
      where: { id },
      data: { status: 'COMPLETED' },
    })

    return NextResponse.json({ session: updatedSession })
  } catch (error) {
    console.error('Error completing AI interview:', error)
    return NextResponse.json({ error: 'Failed to complete AI interview' }, { status: 500 })
  }
}
