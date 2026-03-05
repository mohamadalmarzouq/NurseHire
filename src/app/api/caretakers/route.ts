import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated (optional)
    let isAuthenticated = false
    const token = request.cookies.get('auth-token')?.value
    if (token) {
      const payload = await verifyToken(token)
      if (payload) {
        isAuthenticated = true
      }
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const experience = searchParams.get('experience')
    const salary = searchParams.get('salary')
    const availability = searchParams.get('availability')
    const language = searchParams.get('language')
    const skills = searchParams.get('skills')

    // Build where clause for filtering
    const whereClause: any = {
      candidateProfile: {
        status: 'APPROVED', // Only show approved candidates
      },
    }

    // Add search filter
    if (search) {
      whereClause.OR = [
        { candidateProfile: { name: { contains: search, mode: 'insensitive' } } },
        { candidateProfile: { aboutMe: { contains: search, mode: 'insensitive' } } },
      ]
    }

    // Add experience filter
    if (experience) {
      const expValue = parseInt(experience)
      whereClause.candidateProfile = {
        ...whereClause.candidateProfile,
        totalExperience: { gte: expValue },
      }
    }

    // Add salary filter
    if (salary) {
      const salaryValue = parseFloat(salary)
      whereClause.candidateProfile = {
        ...whereClause.candidateProfile,
        partTimeSalary: { lte: salaryValue },
      }
    }

    // Add availability filter
    if (availability) {
      whereClause.candidateProfile = {
        ...whereClause.candidateProfile,
        availability: { has: availability },
      }
    }

    // Add language filter
    if (language) {
      whereClause.candidateProfile = {
        ...whereClause.candidateProfile,
        languages: { has: language },
      }
    }

    // Add skills filter
    if (skills) {
      whereClause.candidateProfile = {
        ...whereClause.candidateProfile,
        skills: { has: skills },
      }
    }

    const candidates = await prisma.user.findMany({
      where: whereClause,
      include: {
        candidateProfile: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Only fetch reviews if user is authenticated
    let ratingsByCandidate: Record<string, { sum: number; count: number }> = {}
    if (isAuthenticated) {
      const candidateIds = candidates.map(c => c.id)
      const reviews = await prisma.review.findMany({
        where: {
          receiverId: { in: candidateIds },
          status: 'APPROVED',
        },
      })

      // Calculate ratings per candidate
      reviews.forEach(review => {
        if (!ratingsByCandidate[review.receiverId]) {
          ratingsByCandidate[review.receiverId] = { sum: 0, count: 0 }
        }
        const avg = (review.appearance + review.attitude + review.knowledge + review.hygiene + review.salary) / 5
        ratingsByCandidate[review.receiverId].sum += avg
        ratingsByCandidate[review.receiverId].count += 1
      })
    }

    // Format the response
    const formattedCandidates = candidates.map(candidate => {
      const ratingData = ratingsByCandidate[candidate.id] || { sum: 0, count: 0 }
      return {
        id: candidate.id,
        name: candidate.candidateProfile?.name || 'Unknown',
        age: candidate.candidateProfile?.age || 0,
        totalExperience: candidate.candidateProfile?.totalExperience || 0,
        kuwaitExperience: candidate.candidateProfile?.kuwaitExperience || 0,
        partTimeSalary: candidate.candidateProfile?.partTimeSalary || 0,
        fullTimeSalary: candidate.candidateProfile?.fullTimeSalary || 0,
        aboutMe: candidate.candidateProfile?.aboutMe || '',
        profileImageUrl: candidate.candidateProfile?.profileImageUrl,
        languages: candidate.candidateProfile?.languages || [],
        skills: candidate.candidateProfile?.skills || [],
        availability: candidate.candidateProfile?.availability || [],
        // Only include ratings/reviews if authenticated
        averageRating: isAuthenticated && ratingData.count > 0 ? ratingData.sum / ratingData.count : null,
        reviewCount: isAuthenticated ? ratingData.count : null,
      }
    })

    return NextResponse.json({
      candidates: formattedCandidates,
      total: formattedCandidates.length,
    })
  } catch (error) {
    console.error('Error fetching candidates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
