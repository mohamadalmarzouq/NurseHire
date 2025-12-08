import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: caretakerId } = await params

    // Find user with care taker profile
    const user = await prisma.user.findUnique({
      where: { id: caretakerId },
      include: {
        caretakerProfile: true,
      },
    })

    if (!user || !user.caretakerProfile) {
      return NextResponse.json(
        { error: 'Care taker not found' },
        { status: 404 }
      )
    }

    // Get approved reviews for this care taker
    const reviewsData = await prisma.review.findMany({
      where: {
        receiverId: caretakerId,
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

    const caretaker = {
      id: user.id,
      name: user.caretakerProfile.name,
      age: user.caretakerProfile.age,
      totalExperience: user.caretakerProfile.totalExperience,
      kuwaitExperience: user.caretakerProfile.kuwaitExperience,
      gccExperience: user.caretakerProfile.gccExperience || 0,
      partTimeSalary: user.caretakerProfile.partTimeSalary,
      fullTimeSalary: user.caretakerProfile.fullTimeSalary,
      expectedSalary: user.caretakerProfile.expectedSalary,
      maritalStatus: user.caretakerProfile.maritalStatus,
      aboutMe: user.caretakerProfile.aboutMe || 'No description provided',
      profileImageUrl: user.caretakerProfile.profileImageUrl,
      averageRating: averageRating || 0,
      reviewCount: reviewCount,
      languages: user.caretakerProfile.languages || [],
      skills: user.caretakerProfile.skills || [],
      availability: user.caretakerProfile.availability || [],
      status: user.caretakerProfile.status,
      certifications: user.caretakerProfile.certifications || [],
    }

    return NextResponse.json({
      caretaker,
      reviews,
    })
  } catch (error) {
    console.error('Error fetching care taker profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
