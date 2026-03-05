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

    const candidates = await prisma.user.findMany({
      where: { role: 'CANDIDATE' },
      include: {
        candidateProfile: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      candidates: candidates.map(candidate => ({
        id: candidate.id,
        name: candidate.candidateProfile?.name || 'Unknown',
        email: candidate.email,
        phone: candidate.candidateProfile?.phone,
        location: candidate.candidateProfile?.location,
        totalExperience: candidate.candidateProfile?.totalExperience || 0,
        kuwaitExperience: candidate.candidateProfile?.kuwaitExperience || 0,
        partTimeSalary: candidate.candidateProfile?.partTimeSalary || 0,
        fullTimeSalary: candidate.candidateProfile?.fullTimeSalary || 0,
        aboutMe: candidate.candidateProfile?.aboutMe || '',
        languages: candidate.candidateProfile?.languages || [],
        availability: candidate.candidateProfile?.availability || [],
        cvUrl: candidate.candidateProfile?.cvUrl,
        profileImageUrl: candidate.candidateProfile?.profileImageUrl,
        certifications: candidate.candidateProfile?.certifications || [],
        status: candidate.candidateProfile?.status || 'PENDING',
        submittedAt: candidate.createdAt,
        createdAt: candidate.createdAt,
        age: candidate.candidateProfile?.age || 0,
      }))
    })
  } catch (error) {
    console.error('Error fetching candidates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
