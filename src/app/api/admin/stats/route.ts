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
      totalCaretakers,
      pendingCaretakers,
      approvedCaretakers,
      totalUsers,
      totalRequests,
      totalReviews,
      pendingReviews,
      recentRequests
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'CARETAKER' } }),
      prisma.user.count({ 
        where: { 
          role: 'CARETAKER',
          caretakerProfile: { status: 'PENDING' }
        } 
      }),
      prisma.user.count({ 
        where: { 
          role: 'CARETAKER',
          caretakerProfile: { status: 'APPROVED' }
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
          caretaker: {
            include: { caretakerProfile: true }
          }
        }
      })
    ])

    return NextResponse.json({
      stats: {
        totalCaretakers,
        pendingApprovals: pendingCaretakers,
        approvedCaretakers,
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
        caretaker: {
          name: request.caretaker.caretakerProfile?.name || 'Unknown',
          email: request.caretaker.email,
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
