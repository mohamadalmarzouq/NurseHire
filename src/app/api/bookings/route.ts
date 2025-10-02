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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'sent' or 'received'

    let whereClause: any = {}

    if (payload.role === 'MOTHER') {
      if (type === 'sent') {
        whereClause = { requesterId: payload.id }
      } else {
        whereClause = { requesterId: payload.id }
      }
    } else if (payload.role === 'NURSE') {
      whereClause = { nurseId: payload.id }
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        requester: {
          include: {
            motherProfile: true,
          },
        },
        nurse: {
          include: {
            nurseProfile: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      bookings: bookings.map(booking => ({
        id: booking.id,
        status: booking.status,
        message: booking.message,
        startDate: booking.startDate,
        endDate: booking.endDate,
        createdAt: booking.createdAt,
        requester: {
          id: booking.requester.id,
          name: booking.requester.motherProfile?.name || 'Unknown',
          email: booking.requester.email,
        },
        nurse: {
          id: booking.nurse.id,
          name: booking.nurse.nurseProfile?.name || 'Unknown',
          email: booking.nurse.email,
        },
      })),
    })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'MOTHER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { nurseId, message, startDate, endDate } = body

    if (!nurseId) {
      return NextResponse.json({ error: 'Nurse ID is required' }, { status: 400 })
    }

    // Check if nurse exists and is approved
    const nurse = await prisma.user.findUnique({
      where: { id: nurseId },
      include: { nurseProfile: true },
    })

    if (!nurse || !nurse.nurseProfile || nurse.nurseProfile.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Nurse not found or not approved' }, { status: 404 })
    }

    // Create booking request
    const booking = await prisma.booking.create({
      data: {
        requesterId: payload.id,
        nurseId,
        message,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
      include: {
        requester: {
          include: {
            motherProfile: true,
          },
        },
        nurse: {
          include: {
            nurseProfile: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        status: booking.status,
        message: booking.message,
        startDate: booking.startDate,
        endDate: booking.endDate,
        createdAt: booking.createdAt,
        requester: {
          id: booking.requester.id,
          name: booking.requester.motherProfile?.name || 'Unknown',
        },
        nurse: {
          id: booking.nurse.id,
          name: booking.nurse.nurseProfile?.name || 'Unknown',
        },
      },
    })
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
