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

    // Format the response
    const formattedNurses = nurses.map(nurse => ({
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
      averageRating: 0, // Will be calculated from reviews later
      reviewCount: 0, // Will be calculated from reviews later
    }))

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
