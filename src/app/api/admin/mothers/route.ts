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

    const mothers = await prisma.user.findMany({
      where: { role: 'MOTHER' },
      include: {
        motherProfile: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      mothers: mothers.map(mother => ({
        id: mother.id,
        name: mother.motherProfile?.name || 'Unknown',
        email: mother.email,
        phone: mother.motherProfile?.phone || '',
        location: mother.motherProfile?.location || '',
        joinedAt: mother.createdAt,
      }))
    })
  } catch (error) {
    console.error('Error fetching mothers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
