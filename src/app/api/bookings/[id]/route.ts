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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: bookingId } = await params
    const body = await request.json()
    const { status } = body

    if (!['ACCEPTED', 'DECLINED', 'CANCELLED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Find the booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        requester: true,
        nurse: true,
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Check permissions
    if (payload.role === 'NURSE' && booking.nurseId !== payload.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (payload.role === 'USER' && booking.requesterId !== payload.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: status as any },
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
    })

    return NextResponse.json({
      success: true,
      booking: {
        id: updatedBooking.id,
        status: updatedBooking.status,
        message: updatedBooking.message,
        startDate: updatedBooking.startDate,
        endDate: updatedBooking.endDate,
        createdAt: updatedBooking.createdAt,
        requester: {
          id: updatedBooking.requester.id,
          name: updatedBooking.requester.userProfile?.name || 'Unknown',
        },
        nurse: {
          id: updatedBooking.nurse.id,
          name: updatedBooking.nurse.nurseProfile?.name || 'Unknown',
        },
      },
    })
  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
