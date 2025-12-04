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

    const pendingCaretakers = await prisma.user.findMany({
      where: {
        role: 'CARETAKER',
        caretakerProfile: { status: 'PENDING' }
      },
      include: {
        caretakerProfile: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json({
      caretakers: pendingCaretakers.map(caretaker => ({
        id: caretaker.id,
        name: caretaker.caretakerProfile?.name || 'Unknown',
        email: caretaker.email,
        totalExperience: caretaker.caretakerProfile?.totalExperience || 0,
        kuwaitExperience: caretaker.caretakerProfile?.kuwaitExperience || 0,
        partTimeSalary: caretaker.caretakerProfile?.partTimeSalary || 0,
        fullTimeSalary: caretaker.caretakerProfile?.fullTimeSalary || 0,
        aboutMe: caretaker.caretakerProfile?.aboutMe || '',
        languages: caretaker.caretakerProfile?.languages || [],
        availability: caretaker.caretakerProfile?.availability || [],
        cvUrl: caretaker.caretakerProfile?.cvUrl,
        profileImageUrl: caretaker.caretakerProfile?.profileImageUrl,
        submittedAt: caretaker.createdAt,
        age: caretaker.caretakerProfile?.age || 0,
      }))
    })
  } catch (error) {
    console.error('Error fetching pending care takers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
