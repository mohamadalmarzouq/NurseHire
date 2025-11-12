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
      totalRequests,
      totalReviews,
      pendingReviews,
      recentRequests
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
      prisma.informationRequest.count(),
      prisma.review.count(),
      prisma.review.count({ where: { status: 'PENDING' } }),
      prisma.informationRequest.findMany({
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
        totalRequests,
        totalReviews,
        pendingReviews,
      },
      recentRequests: recentRequests.map(request => ({
        id: request.id,
        status: request.status,
        urgency: request.urgency,
        createdAt: request.createdAt,
        requester: {
          name: request.requester.userProfile?.name || 'Unknown',
          email: request.requester.email,
        },
        nurse: {
          name: request.nurse.nurseProfile?.name || 'Unknown',
          email: request.nurse.email,
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
