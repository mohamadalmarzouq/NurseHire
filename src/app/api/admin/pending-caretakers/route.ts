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

    const pendingCandidates = await prisma.user.findMany({
      where: {
        role: 'CANDIDATE',
        candidateProfile: { status: 'PENDING' }
      },
      include: {
        candidateProfile: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json({
      candidates: pendingCandidates.map(candidate => ({
        id: candidate.id,
        name: candidate.candidateProfile?.name || 'Unknown',
        email: candidate.email,
        totalExperience: candidate.candidateProfile?.totalExperience || 0,
        kuwaitExperience: candidate.candidateProfile?.kuwaitExperience || 0,
        partTimeSalary: candidate.candidateProfile?.partTimeSalary || 0,
        fullTimeSalary: candidate.candidateProfile?.fullTimeSalary || 0,
        aboutMe: candidate.candidateProfile?.aboutMe || '',
        languages: candidate.candidateProfile?.languages || [],
        availability: candidate.candidateProfile?.availability || [],
        cvUrl: candidate.candidateProfile?.cvUrl,
        profileImageUrl: candidate.candidateProfile?.profileImageUrl,
        submittedAt: candidate.createdAt,
        age: candidate.candidateProfile?.age || 0,
      }))
    })
  } catch (error) {
    console.error('Error fetching pending candidates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
