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
    const type = searchParams.get('type') // 'given' or 'received'

    let whereClause: any = {}

    if (type === 'given') {
      whereClause = { giverId: payload.id }
    } else if (type === 'received') {
      whereClause = { receiverId: payload.id }
    } else {
      // Default to received reviews
      whereClause = { receiverId: payload.id }
    }

    const reviews = await prisma.review.findMany({
      where: whereClause,
      include: {
        giver: {
          include: {
            motherProfile: true,
            nurseProfile: true,
          },
        },
        receiver: {
          include: {
            motherProfile: true,
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
        createdAt: review.createdAt,
        giver: {
          id: review.giver.id,
          name: review.giver.motherProfile?.name || review.giver.nurseProfile?.name || 'Unknown',
          role: review.giver.role,
        },
        receiver: {
          id: review.receiver.id,
          name: review.receiver.motherProfile?.name || review.receiver.nurseProfile?.name || 'Unknown',
          role: review.receiver.role,
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
    const { receiverId, appearance, attitude, knowledge, hygiene, salary, comment } = body

    if (!receiverId || !appearance || !attitude || !knowledge || !hygiene || !salary) {
      return NextResponse.json({ error: 'All rating fields are required' }, { status: 400 })
    }

    // Check if receiver exists and is a nurse
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      include: { nurseProfile: true },
    })

    if (!receiver || !receiver.nurseProfile) {
      return NextResponse.json({ error: 'Nurse not found' }, { status: 404 })
    }

    // Check if review already exists
    const existingReview = await prisma.review.findUnique({
      where: {
        giverId_receiverId: {
          giverId: payload.id,
          receiverId: receiverId,
        },
      },
    })

    if (existingReview) {
      return NextResponse.json({ error: 'Review already exists for this nurse' }, { status: 400 })
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        giverId: payload.id,
        receiverId,
        appearance: parseInt(appearance),
        attitude: parseInt(attitude),
        knowledge: parseInt(knowledge),
        hygiene: parseInt(hygiene),
        salary: parseInt(salary),
        comment: comment || null,
      },
      include: {
        giver: {
          include: {
            motherProfile: true,
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
        appearance: review.appearance,
        attitude: review.attitude,
        knowledge: review.knowledge,
        hygiene: review.hygiene,
        salary: review.salary,
        comment: review.comment,
        createdAt: review.createdAt,
        giver: {
          id: review.giver.id,
          name: review.giver.motherProfile?.name || 'Unknown',
        },
        receiver: {
          id: review.receiver.id,
          name: review.receiver.nurseProfile?.name || 'Unknown',
        },
        averageRating: (review.appearance + review.attitude + review.knowledge + review.hygiene + review.salary) / 5,
      },
    })
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
