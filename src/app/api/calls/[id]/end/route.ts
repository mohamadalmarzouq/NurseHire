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

    const bothJoined = !!updatedCall.userJoinedAt && !!updatedCall.caretakerJoinedAt
    const bothLeft = !!updatedCall.userLeftAt && !!updatedCall.caretakerLeftAt

    if (bothJoined && bothLeft) {
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
