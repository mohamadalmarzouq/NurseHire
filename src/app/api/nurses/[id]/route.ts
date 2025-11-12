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

    // Get approved reviews for this nurse
    const reviewsData = await prisma.review.findMany({
      where: {
        receiverId: nurseId,
        status: 'APPROVED',
      },
      include: {
        giver: {
          include: {
            userProfile: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const reviews = reviewsData.map(review => ({
      id: review.id,
      giverName: review.giver.userProfile?.name || 'Anonymous',
      appearance: review.appearance,
      attitude: review.attitude,
      knowledge: review.knowledge,
      hygiene: review.hygiene,
      salary: review.salary,
      comment: review.comment,
      createdAt: review.createdAt,
    }))

    // Calculate average rating from approved reviews
    const reviewCount = reviews.length
    const averageRating = reviewCount > 0
      ? reviews.reduce((sum, review) => {
          const avg = (review.appearance + review.attitude + review.knowledge + review.hygiene + review.salary) / 5
          return sum + avg
        }, 0) / reviewCount
      : 0

    const nurse = {
      id: user.id,
      name: user.nurseProfile.name,
      age: user.nurseProfile.age,
      totalExperience: user.nurseProfile.totalExperience,
      kuwaitExperience: user.nurseProfile.kuwaitExperience,
      partTimeSalary: user.nurseProfile.partTimeSalary,
      fullTimeSalary: user.nurseProfile.fullTimeSalary,
      aboutMe: user.nurseProfile.aboutMe || 'No description provided',
      profileImageUrl: user.nurseProfile.profileImageUrl,
      averageRating: averageRating || 0,
      reviewCount: reviewCount,
      languages: user.nurseProfile.languages || [],
      availability: user.nurseProfile.availability || [],
      status: user.nurseProfile.status,
      certifications: user.nurseProfile.certifications || [],
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
