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

    // Get all stats in parallel
    const [
      totalNurses,
      pendingNurses,
      approvedNurses,
      totalUsers,
      totalBookings,
      totalReviews,
      recentBookings
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'NURSE' } }),
      prisma.user.count({ 
        where: { 
          role: 'NURSE',
          nurseProfile: { status: 'PENDING' }
        } 
      }),
      prisma.user.count({ 
        where: { 
          role: 'NURSE',
          nurseProfile: { status: 'APPROVED' }
        } 
      }),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.booking.count(),
      prisma.review.count(),
      prisma.booking.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          requester: {
            include: { userProfile: true }
          },
          nurse: {
            include: { nurseProfile: true }
          }
        }
      })
    ])

    return NextResponse.json({
      stats: {
        totalNurses,
        pendingApprovals: pendingNurses,
        approvedNurses,
        totalUsers,
        totalBookings,
        totalReviews,
      },
      recentBookings: recentBookings.map(booking => ({
        id: booking.id,
        status: booking.status,
        createdAt: booking.createdAt,
        requester: {
          name: booking.requester.userProfile?.name || 'Unknown',
          email: booking.requester.email,
        },
        nurse: {
          name: booking.nurse.nurseProfile?.name || 'Unknown',
          email: booking.nurse.email,
        },
      }))
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
