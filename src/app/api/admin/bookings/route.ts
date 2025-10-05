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
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const bookings = await prisma.booking.findMany({
      include: {
        requester: {
          include: {
            userProfile: true,
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
          name: booking.requester.userProfile?.name || 'Unknown',
          email: booking.requester.email,
        },
        nurse: {
          id: booking.nurse.id,
          name: booking.nurse.nurseProfile?.name || 'Unknown',
          email: booking.nurse.email,
        },
      }))
    })
  } catch (error) {
    console.error('Error fetching admin bookings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
