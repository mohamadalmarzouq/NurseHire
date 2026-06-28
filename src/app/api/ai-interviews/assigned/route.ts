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
    if (!payload || payload.role !== 'CANDIDATE') {
      return NextResponse.json({ error: 'Candidate access required' }, { status: 403 })
    }

    const interviews = await prisma.aiInterview.findMany({
      where: { candidateId: payload.id },
      include: {
        user: { include: { userProfile: true } },
        sessions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ interviews })
  } catch (error) {
    console.error('Error fetching assigned AI interviews:', error)
    return NextResponse.json({ error: 'Failed to fetch AI interviews' }, { status: 500 })
  }
}
