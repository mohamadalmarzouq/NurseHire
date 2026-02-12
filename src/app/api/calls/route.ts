import { NextRequest, NextResponse } from 'next/server'
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
    const caretakerIdParam = searchParams.get('caretakerId')
    const requestIdParam = searchParams.get('requestId')

    let whereClause: any = {}
    if (payload.role === 'USER') {
      whereClause = { userId: payload.id }
      if (caretakerIdParam) {
        whereClause.caretakerId = caretakerIdParam
      }
      if (requestIdParam) {
        whereClause.requestId = requestIdParam
      }
    } else if (payload.role === 'CARETAKER') {
      whereClause = { caretakerId: payload.id }
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
        caretaker: { include: { caretakerProfile: true } },
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
    const { requestId, scheduledAt, durationMinutes, timezone } = body

    if (!requestId || !scheduledAt || !durationMinutes || !timezone) {
      return NextResponse.json(
        { error: 'requestId, scheduledAt, durationMinutes, and timezone are required' },
        { status: 400 }
      )
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

    const existingCall = await prisma.callSession.findFirst({
      where: {
        requestId: infoRequest.id,
        status: { in: ['REQUESTED', 'ACCEPTED'] },
      },
      orderBy: { scheduledAt: 'desc' },
    })

    if (existingCall) {
      return NextResponse.json(
        { error: 'There is already a pending or accepted call for this request' },
        { status: 400 }
      )
    }

    const call = await prisma.callSession.create({
      data: {
        requestId: infoRequest.id,
        userId: payload.id,
        caretakerId: infoRequest.caretakerId,
        scheduledAt: scheduledDate,
        durationMinutes: durationValue,
        timezone,
        status: 'REQUESTED',
      },
      include: {
        request: true,
        user: { include: { userProfile: true } },
        caretaker: { include: { caretakerProfile: true } },
      },
    })

    return NextResponse.json({ call })
  } catch (error) {
    console.error('Error creating call:', error)
    return NextResponse.json({ error: 'Failed to create call' }, { status: 500 })
  }
}
