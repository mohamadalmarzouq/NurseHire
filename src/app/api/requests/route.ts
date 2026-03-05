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
          candidate: {
            include: { candidateProfile: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    } else if (payload.role === 'CANDIDATE') {
      // Candidates see requests about them
      requests = await prisma.informationRequest.findMany({
        where: { candidateId: payload.id },
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
    const { message, phone, preferredContactTime, urgency } = body
    const candidateId = body.candidateId || body.caretakerId

    if (!candidateId || !message) {
      return NextResponse.json(
        { error: 'Candidate ID and message are required' },
        { status: 400 }
      )
    }

    // Verify candidate exists and is approved
    const candidate = await prisma.user.findFirst({
      where: {
        id: candidateId,
        role: 'CANDIDATE',
        candidateProfile: {
          status: 'APPROVED'
        }
      }
    })

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found or not approved' },
        { status: 404 }
      )
    }

    const informationRequest = await prisma.informationRequest.create({
      data: {
        requesterId: payload.id,
        candidateId,
        message,
        phone: phone || null,
        preferredContactTime: preferredContactTime || null,
        urgency: urgency || 'MEDIUM',
      },
      include: {
        candidate: {
          include: { candidateProfile: true }
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
