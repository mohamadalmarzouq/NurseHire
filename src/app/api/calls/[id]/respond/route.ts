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
    if (!payload || payload.role !== 'CARETAKER') {
      return NextResponse.json({ error: 'Care taker access required' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!['ACCEPTED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const call = await prisma.callSession.findFirst({
      where: { id, caretakerId: payload.id },
    })

    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 })
    }

    if (call.status !== 'REQUESTED') {
      return NextResponse.json(
        { error: 'Only requested calls can be updated' },
        { status: 400 }
      )
    }

    const updatedCall = await prisma.callSession.update({
      where: { id: call.id },
      data: { status },
      include: {
        request: true,
        user: { include: { userProfile: true } },
        caretaker: { include: { caretakerProfile: true } },
      },
    })

    return NextResponse.json({ call: updatedCall })
  } catch (error) {
    console.error('Error responding to call:', error)
    return NextResponse.json({ error: 'Failed to update call' }, { status: 500 })
  }
}
