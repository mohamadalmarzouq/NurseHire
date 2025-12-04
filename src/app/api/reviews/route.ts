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
    const includePending = searchParams.get('includePending') === 'true' // For users to see their own pending reviews

    let whereClause: any = {}

    if (type === 'given') {
      // Users can see all their reviews (including pending)
      whereClause = { giverId: payload.id }
    } else if (type === 'received') {
      // For received reviews, show only approved unless user is viewing their own
      if (payload.role === 'CARETAKER' && includePending) {
        whereClause = { receiverId: payload.id }
      } else {
        whereClause = { receiverId: payload.id, status: 'APPROVED' }
      }
    } else {
      // Default: show only approved reviews for public viewing
      whereClause = { receiverId: payload.id, status: 'APPROVED' }
    }

    const reviews = await prisma.review.findMany({
      where: whereClause,
      include: {
        giver: {
          include: {
            userProfile: true,
            caretakerProfile: true,
          },
        },
        receiver: {
          include: {
            userProfile: true,
            caretakerProfile: true,
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
          name: review.giver.userProfile?.name || review.giver.caretakerProfile?.name || 'Unknown',
          role: review.giver.role,
        },
        receiver: {
          id: review.receiver.id,
          name: review.receiver.userProfile?.name || review.receiver.caretakerProfile?.name || 'Unknown',
          role: review.receiver.role,
        },
        status: review.status,
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
    if (!payload || payload.role !== 'USER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { receiverId, appearance, attitude, knowledge, hygiene, salary, comment } = body

    if (!receiverId || !appearance || !attitude || !knowledge || !hygiene || !salary) {
      return NextResponse.json({ error: 'All rating fields are required' }, { status: 400 })
    }

    // Check if receiver exists and is a care taker
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      include: { caretakerProfile: true },
    })

    if (!receiver || !receiver.caretakerProfile) {
      return NextResponse.json({ error: 'Care taker not found' }, { status: 404 })
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
      return NextResponse.json({ error: 'Review already exists for this care taker' }, { status: 400 })
    }

    // Create review with PENDING status
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
        status: 'PENDING',
      },
      include: {
        giver: {
          include: {
            userProfile: true,
          },
        },
        receiver: {
          include: {
            caretakerProfile: true,
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
          name: review.giver.userProfile?.name || 'Unknown',
        },
        receiver: {
          id: review.receiver.id,
          name: review.receiver.caretakerProfile?.name || 'Unknown',
        },
        status: review.status,
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
