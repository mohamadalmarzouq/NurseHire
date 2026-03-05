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
      totalCandidates,
      pendingCandidates,
      approvedCandidates,
      totalUsers,
      totalRequests,
      totalReviews,
      pendingReviews,
      recentRequests
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'CANDIDATE' } }),
      prisma.user.count({ 
        where: { 
          role: 'CANDIDATE',
          candidateProfile: { status: 'PENDING' }
        } 
      }),
      prisma.user.count({ 
        where: { 
          role: 'CANDIDATE',
          candidateProfile: { status: 'APPROVED' }
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
          candidate: {
            include: { candidateProfile: true }
          }
        }
      })
    ])

    return NextResponse.json({
      stats: {
        totalCandidates,
        pendingApprovals: pendingCandidates,
        approvedCandidates,
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
        candidate: {
          name: request.candidate.candidateProfile?.name || 'Unknown',
          email: request.candidate.email,
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
