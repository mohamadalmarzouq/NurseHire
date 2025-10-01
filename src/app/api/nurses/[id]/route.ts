import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: nurseId } = await params

    // Find user with nurse profile
    const user = await prisma.user.findUnique({
      where: { id: nurseId },
      include: {
        nurseProfile: true,
      },
    })

    if (!user || !user.nurseProfile) {
      return NextResponse.json(
        { error: 'Nurse not found' },
        { status: 404 }
      )
    }

    // Get reviews for this nurse (will be implemented later)
    const reviews: any[] = []

    // Calculate average rating (will be based on real reviews later)
    const averageRating = 0
    const reviewCount = 0

    const nurse = {
      id: user.id,
      name: user.nurseProfile.name,
      age: user.nurseProfile.age,
      totalExperience: user.nurseProfile.totalExperience,
      kuwaitExperience: user.nurseProfile.kuwaitExperience,
      partTimeSalary: user.nurseProfile.partTimeSalary,
      nightShiftSalary: user.nurseProfile.nightShiftSalary,
      aboutMe: user.nurseProfile.aboutMe || 'No description provided',
      profileImageUrl: user.nurseProfile.profileImageUrl,
      averageRating: averageRating || 0,
      reviewCount: reviewCount,
      languages: user.nurseProfile.languages || [],
      availability: user.nurseProfile.availability || [],
      status: user.nurseProfile.status,
    }

    return NextResponse.json({
      nurse,
      reviews,
    })
  } catch (error) {
    console.error('Error fetching nurse profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
