import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { hasActiveSubscription } from '@/lib/subscription'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: caretakerId } = await params

    // Check if requesting user is authenticated
    let isAuthenticated = false
    let hasSubscription = false
    const token = request.cookies.get('auth-token')?.value
    if (token) {
      const payload = await verifyToken(token)
      if (payload) {
        isAuthenticated = true
        if (payload.role === 'USER') {
          hasSubscription = await hasActiveSubscription(payload.id)
        } else {
          // Non-USER roles (CARETAKER, ADMIN) can see reviews
          hasSubscription = true
        }
      }
    }

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

    // Only fetch reviews if user is authenticated
    let reviews: any[] = []
    let reviewCount = 0
    let averageRating = 0

    if (isAuthenticated) {
      // Authenticated users or non-users can see reviews
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

      reviews = reviewsData.map(review => ({
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
      reviewCount = reviews.length
      averageRating = reviewCount > 0
        ? reviews.reduce((sum, review) => {
            const avg = (review.appearance + review.attitude + review.knowledge + review.hygiene + review.salary) / 5
            return sum + avg
          }, 0) / reviewCount
        : 0
    }

    const caretaker = {
      id: user.id,
      name: user.caretakerProfile.name,
      age: user.caretakerProfile.age,
      // Only include phone if user has active subscription
      phone: hasSubscription ? user.caretakerProfile.phone : null,
      location: user.caretakerProfile.location,
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
      // Include subscription status for frontend to show prompts
      hasActiveSubscription: hasSubscription,
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
