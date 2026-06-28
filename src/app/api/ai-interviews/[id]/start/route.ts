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
    const interview = await prisma.aiInterview.findFirst({
      where: { id, candidateId: payload.id },
    })

    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
    }

    const existingSession = await prisma.aiInterviewSession.findFirst({
      where: { interviewId: id, candidateId: payload.id },
    })

    if (existingSession) {
      if (existingSession.status === 'IN_PROGRESS') {
        return NextResponse.json({ session: existingSession, resumed: true })
      }
      return NextResponse.json(
        { error: 'Interview already started for this candidate' },
        { status: 400 }
      )
    }

    const session = await prisma.aiInterviewSession.create({
      data: {
        interviewId: id,
        candidateId: payload.id,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
    })

    await prisma.aiInterview.update({
      where: { id },
      data: { status: 'RUNNING' },
    })

    return NextResponse.json({ session })
  } catch (error) {
    console.error('Error starting AI interview:', error)
    return NextResponse.json({ error: 'Failed to start AI interview' }, { status: 500 })
  }
}
