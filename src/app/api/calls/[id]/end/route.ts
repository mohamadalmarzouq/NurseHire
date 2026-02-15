import { NextRequest, NextResponse } from 'next/server'
import { RecordingStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

const DAILY_API_KEY = process.env.DAILY_API_KEY

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

    const { id } = await params
    const callSession = await prisma.callSession.findFirst({
      where: {
        id,
        OR: [{ userId: payload.id }, { caretakerId: payload.id }],
      },
    })

    if (!callSession) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 })
    }

    const leftData: { userLeftAt?: Date; caretakerLeftAt?: Date } = {}
    if (payload.role === 'CARETAKER') {
      leftData.caretakerLeftAt = new Date()
    } else {
      leftData.userLeftAt = new Date()
    }

    const updatedCall = await prisma.callSession.update({
      where: { id: callSession.id },
      data: leftData,
    })

    if (updatedCall.recordingStatus === 'RECORDING') {
      if (!DAILY_API_KEY) {
        return NextResponse.json({ error: 'Daily is not configured' }, { status: 500 })
      }

      if (!updatedCall.dailyRoomName) {
        return NextResponse.json({ error: 'Call room not ready' }, { status: 400 })
      }

      const stopRes = await fetch(
        `https://api.daily.co/v1/rooms/${updatedCall.dailyRoomName}/recordings/stop`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${DAILY_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      )

      if (!stopRes.ok) {
        const errorData = await stopRes.json().catch(() => ({}))
        return NextResponse.json(
          { error: errorData.error || 'Failed to stop recording' },
          { status: 500 }
        )
      }

      await prisma.callSession.update({
        where: { id: updatedCall.id },
        data: { recordingStatus: RecordingStatus.PROCESSING },
      })
    }

    const bothJoined = !!updatedCall.userJoinedAt && !!updatedCall.caretakerJoinedAt
    const bothLeft = !!updatedCall.userLeftAt && !!updatedCall.caretakerLeftAt

    if (updatedCall.callActivatedAt && bothJoined && bothLeft) {
      const completedCall = await prisma.callSession.update({
        where: { id: updatedCall.id },
        data: {
          status: 'COMPLETED',
          endedAt: new Date(),
        },
      })
      return NextResponse.json({ call: completedCall })
    }

    return NextResponse.json({ call: updatedCall })
  } catch (error) {
    console.error('Error ending call:', error)
    return NextResponse.json({ error: 'Failed to end call' }, { status: 500 })
  }
}
