import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function PUT(
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

    const call = await prisma.callSession.findFirst({
      where: {
        id,
        OR: [
          { userId: payload.id },
          { caretakerId: payload.id },
        ],
      },
    })

    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 })
    }

    if (!['REQUESTED', 'ACCEPTED'].includes(call.status)) {
      return NextResponse.json(
        { error: 'Only requested or accepted calls can be canceled' },
        { status: 400 }
      )
    }

    const updatedCall = await prisma.callSession.update({
      where: { id: call.id },
      data: { status: 'CANCELED' },
      include: {
        request: true,
        user: { include: { userProfile: true } },
        caretaker: { include: { caretakerProfile: true } },
      },
    })

    return NextResponse.json({ call: updatedCall })
  } catch (error) {
    console.error('Error canceling call:', error)
    return NextResponse.json({ error: 'Failed to cancel call' }, { status: 500 })
  }
}
