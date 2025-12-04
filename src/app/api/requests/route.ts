import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET /api/requests - Fetch information requests for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    let requests
    if (payload.role === 'USER') {
      // Users see their own requests
      requests = await prisma.informationRequest.findMany({
        where: { requesterId: payload.id },
        include: {
          caretaker: {
            include: { caretakerProfile: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    } else if (payload.role === 'CARETAKER') {
      // Care takers see requests about them
      requests = await prisma.informationRequest.findMany({
        where: { caretakerId: payload.id },
        include: {
          requester: {
            include: { userProfile: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    } else {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('Error fetching requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 }
    )
  }
}

// POST /api/requests - Create new information request
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'USER') {
      return NextResponse.json({ error: 'User access required' }, { status: 403 })
    }

    const body = await request.json()
    const { caretakerId, message, phone, preferredContactTime, urgency } = body

    if (!caretakerId || !message) {
      return NextResponse.json(
        { error: 'Care taker ID and message are required' },
        { status: 400 }
      )
    }

    // Verify care taker exists and is approved
    const caretaker = await prisma.user.findFirst({
      where: {
        id: caretakerId,
        role: 'CARETAKER',
        caretakerProfile: {
          status: 'APPROVED'
        }
      }
    })

    if (!caretaker) {
      return NextResponse.json(
        { error: 'Care taker not found or not approved' },
        { status: 404 }
      )
    }

    const informationRequest = await prisma.informationRequest.create({
      data: {
        requesterId: payload.id,
        caretakerId,
        message,
        phone: phone || null,
        preferredContactTime: preferredContactTime || null,
        urgency: urgency || 'MEDIUM',
      },
      include: {
        caretaker: {
          include: { caretakerProfile: true }
        }
      }
    })

    return NextResponse.json({ request: informationRequest })
  } catch (error) {
    console.error('Error creating request:', error)
    return NextResponse.json(
      { error: 'Failed to create request' },
      { status: 500 }
    )
  }
}
