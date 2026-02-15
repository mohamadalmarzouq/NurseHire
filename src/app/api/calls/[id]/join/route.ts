import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

const DAILY_API_KEY = process.env.DAILY_API_KEY
const DAILY_DOMAIN = process.env.DAILY_DOMAIN

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

    if (!DAILY_API_KEY || !DAILY_DOMAIN) {
      return NextResponse.json({ error: 'Daily is not configured' }, { status: 500 })
    }

    const { id } = await params
    const callSession = await prisma.callSession.findFirst({
      where: {
        id,
        OR: [{ userId: payload.id }, { caretakerId: payload.id }],
      },
      include: {
        user: { include: { userProfile: true } },
        caretaker: { include: { caretakerProfile: true } },
      },
    })

    if (!callSession) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 })
    }

    if (!['ACCEPTED', 'REQUESTED'].includes(callSession.status)) {
      return NextResponse.json({ error: 'Call is not active' }, { status: 400 })
    }

    let roomName = callSession.dailyRoomName
    let roomUrl = callSession.dailyRoomUrl

    if (!roomName || !roomUrl) {
      const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 2
      const createRoomRes = await fetch('https://api.daily.co/v1/rooms', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${DAILY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `call-${callSession.id}`,
          privacy: 'private',
          properties: {
            exp: expiresAt,
            enable_chat: true,
          },
        }),
      })

      if (!createRoomRes.ok) {
        const errorData = await createRoomRes.json().catch(() => ({}))
        return NextResponse.json(
          { error: errorData.error || 'Failed to create Daily room' },
          { status: 500 }
        )
      }

      const roomData = await createRoomRes.json()
      roomName = roomData.name
      roomUrl = roomData.url

      await prisma.callSession.update({
        where: { id: callSession.id },
        data: {
          dailyRoomName: roomName,
          dailyRoomUrl: roomUrl,
          startedAt: callSession.startedAt || new Date(),
          status: callSession.status === 'REQUESTED' ? 'ACCEPTED' : callSession.status,
        },
      })
    }

    const joinData: {
      userJoinedAt?: Date
      caretakerJoinedAt?: Date
      startedAt?: Date
      callActivatedAt?: Date
      userLeftAt?: null
      caretakerLeftAt?: null
    } = {}
    if (payload.role === 'CARETAKER' && !callSession.caretakerJoinedAt) {
      joinData.caretakerJoinedAt = new Date()
    }
    if (payload.role !== 'CARETAKER' && !callSession.userJoinedAt) {
      joinData.userJoinedAt = new Date()
    }
    if (!callSession.startedAt) {
      joinData.startedAt = new Date()
    }
    const userJoined = callSession.userJoinedAt || joinData.userJoinedAt
    const caretakerJoined = callSession.caretakerJoinedAt || joinData.caretakerJoinedAt
    if (userJoined && caretakerJoined && !callSession.callActivatedAt) {
      joinData.callActivatedAt = new Date()
      joinData.userLeftAt = null
      joinData.caretakerLeftAt = null
    }
    if (Object.keys(joinData).length > 0) {
      await prisma.callSession.update({
        where: { id: callSession.id },
        data: joinData,
      })
    }

    const displayName =
      callSession.userId === payload.id
        ? callSession.user.userProfile?.name || 'User'
        : callSession.caretaker.caretakerProfile?.name || 'Care Taker'

    const tokenRes = await fetch('https://api.daily.co/v1/meeting-tokens', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          room_name: roomName,
          user_name: displayName,
        },
      }),
    })

    if (!tokenRes.ok) {
      const errorData = await tokenRes.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.error || 'Failed to create meeting token' },
        { status: 500 }
      )
    }

    const tokenData = await tokenRes.json()

    return NextResponse.json({
      roomUrl,
      token: tokenData.token,
      roomName,
    })
  } catch (error) {
    console.error('Error joining call:', error)
    return NextResponse.json({ error: 'Failed to join call' }, { status: 500 })
  }
}
