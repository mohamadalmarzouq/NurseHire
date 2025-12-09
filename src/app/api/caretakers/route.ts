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
      caretakerProfile: {
        status: 'APPROVED', // Only show approved care takers
      },
    }

    // Add search filter
    if (search) {
      whereClause.OR = [
        { caretakerProfile: { name: { contains: search, mode: 'insensitive' } } },
        { caretakerProfile: { aboutMe: { contains: search, mode: 'insensitive' } } },
      ]
    }

    // Add experience filter
    if (experience) {
      const expValue = parseInt(experience)
      whereClause.caretakerProfile = {
        ...whereClause.caretakerProfile,
        totalExperience: { gte: expValue },
      }
    }

    // Add salary filter
    if (salary) {
      const salaryValue = parseFloat(salary)
      whereClause.caretakerProfile = {
        ...whereClause.caretakerProfile,
        partTimeSalary: { lte: salaryValue },
      }
    }

    // Add availability filter
    if (availability) {
      whereClause.caretakerProfile = {
        ...whereClause.caretakerProfile,
        availability: { has: availability },
      }
    }

    // Add language filter
    if (language) {
      whereClause.caretakerProfile = {
        ...whereClause.caretakerProfile,
        languages: { has: language },
      }
    }

    // Add skills filter
    if (skills) {
      whereClause.caretakerProfile = {
        ...whereClause.caretakerProfile,
        skills: { has: skills },
      }
    }

    const caretakers = await prisma.user.findMany({
      where: whereClause,
      include: {
        caretakerProfile: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Only fetch reviews if user is authenticated
    let ratingsByCaretaker: Record<string, { sum: number; count: number }> = {}
    if (isAuthenticated) {
      const caretakerIds = caretakers.map(c => c.id)
      const reviews = await prisma.review.findMany({
        where: {
          receiverId: { in: caretakerIds },
          status: 'APPROVED',
        },
      })

      // Calculate ratings per care taker
      reviews.forEach(review => {
        if (!ratingsByCaretaker[review.receiverId]) {
          ratingsByCaretaker[review.receiverId] = { sum: 0, count: 0 }
        }
        const avg = (review.appearance + review.attitude + review.knowledge + review.hygiene + review.salary) / 5
        ratingsByCaretaker[review.receiverId].sum += avg
        ratingsByCaretaker[review.receiverId].count += 1
      })
    }

    // Format the response
    const formattedCaretakers = caretakers.map(caretaker => {
      const ratingData = ratingsByCaretaker[caretaker.id] || { sum: 0, count: 0 }
      return {
        id: caretaker.id,
        name: caretaker.caretakerProfile?.name || 'Unknown',
        age: caretaker.caretakerProfile?.age || 0,
        totalExperience: caretaker.caretakerProfile?.totalExperience || 0,
        kuwaitExperience: caretaker.caretakerProfile?.kuwaitExperience || 0,
        partTimeSalary: caretaker.caretakerProfile?.partTimeSalary || 0,
        fullTimeSalary: caretaker.caretakerProfile?.fullTimeSalary || 0,
        aboutMe: caretaker.caretakerProfile?.aboutMe || '',
        profileImageUrl: caretaker.caretakerProfile?.profileImageUrl,
        languages: caretaker.caretakerProfile?.languages || [],
        skills: caretaker.caretakerProfile?.skills || [],
        availability: caretaker.caretakerProfile?.availability || [],
        // Only include ratings/reviews if authenticated
        averageRating: isAuthenticated && ratingData.count > 0 ? ratingData.sum / ratingData.count : null,
        reviewCount: isAuthenticated ? ratingData.count : null,
      }
    })

    return NextResponse.json({
      caretakers: formattedCaretakers,
      total: formattedCaretakers.length,
    })
  } catch (error) {
    console.error('Error fetching care takers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
