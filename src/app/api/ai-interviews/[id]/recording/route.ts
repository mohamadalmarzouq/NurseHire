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
    if (!payload || payload.role !== 'USER') {
      return NextResponse.json({ error: 'User access required' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { recordingUrl, recordingPublicId, transcript } = body

    if (!recordingUrl) {
      return NextResponse.json({ error: 'recordingUrl is required' }, { status: 400 })
    }

    const interview = await prisma.aiInterview.findFirst({
      where: { id, userId: payload.id },
    })

    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
    }

    const session = await prisma.aiInterviewSession.findFirst({
      where: { interviewId: id },
      orderBy: { createdAt: 'desc' },
    })

    if (!session) {
      return NextResponse.json({ error: 'Interview session not found' }, { status: 404 })
    }

    const updatedSession = await prisma.aiInterviewSession.update({
      where: { id: session.id },
      data: {
        recordingUrl,
        recordingPublicId: recordingPublicId || null,
        transcript: transcript || null,
        recordingStatus: 'READY',
        status: 'COMPLETED',
        endedAt: new Date(),
      },
    })

    await prisma.aiInterview.update({
      where: { id },
      data: { status: 'COMPLETED' },
    })

    return NextResponse.json({ session: updatedSession })
  } catch (error) {
    console.error('Error saving AI interview recording:', error)
    return NextResponse.json({ error: 'Failed to save AI interview recording' }, { status: 500 })
  }
}
