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
    if (!payload || payload.role !== 'USER') {
      return NextResponse.json({ error: 'User access required' }, { status: 403 })
    }

    const interviews = await prisma.aiInterview.findMany({
      where: { userId: payload.id },
      include: {
        candidate: { include: { candidateProfile: true } },
        sessions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ interviews })
  } catch (error) {
    console.error('Error fetching AI interviews:', error)
    return NextResponse.json({ error: 'Failed to fetch AI interviews' }, { status: 500 })
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
      return NextResponse.json({ error: 'User access required' }, { status: 403 })
    }

    const body = await request.json()
    const { candidateId, candidateIds, title, description, requirements } = body
    const resolvedCandidateIds = Array.isArray(candidateIds)
      ? candidateIds
      : candidateId
        ? [candidateId]
        : []
    const uniqueCandidateIds = Array.from(
      new Set(resolvedCandidateIds.filter((id: unknown) => typeof id === 'string' && id))
    )

    if (uniqueCandidateIds.length === 0 || !title || !description) {
      return NextResponse.json(
        { error: 'candidateIds, title, and description are required' },
        { status: 400 }
      )
    }

    const candidates = await prisma.user.findMany({
      where: {
        id: { in: uniqueCandidateIds },
        role: 'CANDIDATE',
        candidateProfile: { status: 'APPROVED' },
      },
    })

    if (candidates.length !== uniqueCandidateIds.length) {
      return NextResponse.json(
        { error: 'One or more candidates were not found or not approved' },
        { status: 404 }
      )
    }

    const interviews = await prisma.$transaction(
      uniqueCandidateIds.map((selectedId) =>
        prisma.aiInterview.create({
          data: {
            userId: payload.id,
            candidateId: selectedId,
            title,
            description,
            requirements: requirements || null,
          },
          include: {
            candidate: { include: { candidateProfile: true } },
          },
        })
      )
    )

    return NextResponse.json({ interviews })
  } catch (error) {
    console.error('Error creating AI interview:', error)
    return NextResponse.json({ error: 'Failed to create AI interview' }, { status: 500 })
  }
}
