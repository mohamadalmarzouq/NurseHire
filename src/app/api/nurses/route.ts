import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const experience = searchParams.get('experience')
    const salary = searchParams.get('salary')
    const availability = searchParams.get('availability')
    const language = searchParams.get('language')

    // Build where clause for filtering
    const whereClause: any = {
      nurseProfile: {
        status: 'APPROVED', // Only show approved nurses
      },
    }

    // Add search filter
    if (search) {
      whereClause.OR = [
        { nurseProfile: { name: { contains: search, mode: 'insensitive' } } },
        { nurseProfile: { aboutMe: { contains: search, mode: 'insensitive' } } },
      ]
    }

    // Add experience filter
    if (experience) {
      const expValue = parseInt(experience)
      whereClause.nurseProfile = {
        ...whereClause.nurseProfile,
        totalExperience: { gte: expValue },
      }
    }

    // Add salary filter
    if (salary) {
      const salaryValue = parseFloat(salary)
      whereClause.nurseProfile = {
        ...whereClause.nurseProfile,
        partTimeSalary: { lte: salaryValue },
      }
    }

    // Add availability filter
    if (availability) {
      whereClause.nurseProfile = {
        ...whereClause.nurseProfile,
        availability: { has: availability },
      }
    }

    // Add language filter
    if (language) {
      whereClause.nurseProfile = {
        ...whereClause.nurseProfile,
        languages: { has: language },
      }
    }

    const nurses = await prisma.user.findMany({
      where: whereClause,
      include: {
        nurseProfile: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Get approved reviews for all nurses
    const nurseIds = nurses.map(n => n.id)
    const reviews = await prisma.review.findMany({
      where: {
        receiverId: { in: nurseIds },
        status: 'APPROVED',
      },
    })

    // Calculate ratings per nurse
    const ratingsByNurse: Record<string, { sum: number; count: number }> = {}
    reviews.forEach(review => {
      if (!ratingsByNurse[review.receiverId]) {
        ratingsByNurse[review.receiverId] = { sum: 0, count: 0 }
      }
      const avg = (review.appearance + review.attitude + review.knowledge + review.hygiene + review.salary) / 5
      ratingsByNurse[review.receiverId].sum += avg
      ratingsByNurse[review.receiverId].count += 1
    })

    // Format the response
    const formattedNurses = nurses.map(nurse => {
      const ratingData = ratingsByNurse[nurse.id] || { sum: 0, count: 0 }
      return {
        id: nurse.id,
        name: nurse.nurseProfile?.name || 'Unknown',
        age: nurse.nurseProfile?.age || 0,
        totalExperience: nurse.nurseProfile?.totalExperience || 0,
        kuwaitExperience: nurse.nurseProfile?.kuwaitExperience || 0,
        partTimeSalary: nurse.nurseProfile?.partTimeSalary || 0,
        fullTimeSalary: nurse.nurseProfile?.fullTimeSalary || 0,
        aboutMe: nurse.nurseProfile?.aboutMe || '',
        profileImageUrl: nurse.nurseProfile?.profileImageUrl,
        languages: nurse.nurseProfile?.languages || [],
        availability: nurse.nurseProfile?.availability || [],
        averageRating: ratingData.count > 0 ? ratingData.sum / ratingData.count : 0,
        reviewCount: ratingData.count,
      }
    })

    return NextResponse.json({
      nurses: formattedNurses,
      total: formattedNurses.length,
    })
  } catch (error) {
    console.error('Error fetching nurses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
