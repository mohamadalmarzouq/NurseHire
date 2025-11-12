import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET all reviews with status filter
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'PENDING', 'APPROVED', 'REJECTED', or null for all

    let whereClause: any = {}
    if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      whereClause.status = status
    }

    const reviews = await prisma.review.findMany({
      where: whereClause,
      include: {
        giver: {
          include: {
            userProfile: true,
          },
        },
        receiver: {
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
      reviews: reviews.map(review => ({
        id: review.id,
        appearance: review.appearance,
        attitude: review.attitude,
        knowledge: review.knowledge,
        hygiene: review.hygiene,
        salary: review.salary,
        comment: review.comment,
        status: review.status,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        giver: {
          id: review.giver.id,
          name: review.giver.userProfile?.name || 'Unknown',
          email: review.giver.email,
        },
        receiver: {
          id: review.receiver.id,
          name: review.receiver.nurseProfile?.name || 'Unknown',
        },
        averageRating: (review.appearance + review.attitude + review.knowledge + review.hygiene + review.salary) / 5,
      })),
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH to approve or reject a review
export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { reviewId, status } = body

    if (!reviewId || !status) {
      return NextResponse.json({ error: 'Review ID and status are required' }, { status: 400 })
    }

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status. Must be APPROVED or REJECTED' }, { status: 400 })
    }

    const review = await prisma.review.update({
      where: { id: reviewId },
      data: { status },
      include: {
        giver: {
          include: {
            userProfile: true,
          },
        },
        receiver: {
          include: {
            nurseProfile: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      review: {
        id: review.id,
        status: review.status,
        appearance: review.appearance,
        attitude: review.attitude,
        knowledge: review.knowledge,
        hygiene: review.hygiene,
        salary: review.salary,
        comment: review.comment,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        giver: {
          id: review.giver.id,
          name: review.giver.userProfile?.name || 'Unknown',
        },
        receiver: {
          id: review.receiver.id,
          name: review.receiver.nurseProfile?.name || 'Unknown',
        },
        averageRating: (review.appearance + review.attitude + review.knowledge + review.hygiene + review.salary) / 5,
      },
    })
  } catch (error) {
    console.error('Error updating review:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

