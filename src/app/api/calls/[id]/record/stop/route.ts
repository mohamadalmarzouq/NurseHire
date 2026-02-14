import { NextRequest, NextResponse } from 'next/server'
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

    if (!DAILY_API_KEY) {
      return NextResponse.json({ error: 'Daily is not configured' }, { status: 500 })
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

    if (!callSession.dailyRoomName) {
      return NextResponse.json({ error: 'Call room not ready' }, { status: 400 })
    }

    const res = await fetch(
      `https://api.daily.co/v1/rooms/${callSession.dailyRoomName}/recordings/stop`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${DAILY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }
    )

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.error || 'Failed to stop recording' },
        { status: 500 }
      )
    }

    const updated = await prisma.callSession.update({
      where: { id: callSession.id },
      data: {
        recordingStatus: 'PROCESSING',
      },
    })

    return NextResponse.json({ call: updated })
  } catch (error) {
    console.error('Error stopping recording:', error)
    return NextResponse.json({ error: 'Failed to stop recording' }, { status: 500 })
  }
}
