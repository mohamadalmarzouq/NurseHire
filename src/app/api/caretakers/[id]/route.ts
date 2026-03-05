import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { hasActiveSubscription } from '@/lib/subscription'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: candidateId } = await params

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
          // Non-USER roles (CANDIDATE, ADMIN) can see reviews
          hasSubscription = true
        }
      }
    }

    // Find user with candidate profile
    const user = await prisma.user.findUnique({
      where: { id: candidateId },
      include: {
        candidateProfile: true,
      },
    })

    if (!user || !user.candidateProfile) {
      return NextResponse.json(
        { error: 'Candidate not found' },
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
          receiverId: candidateId,
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

    const candidate = {
      id: user.id,
      name: user.candidateProfile.name,
      age: user.candidateProfile.age,
      // Only include phone if user has active subscription
      phone: hasSubscription ? user.candidateProfile.phone : null,
      location: user.candidateProfile.location,
      totalExperience: user.candidateProfile.totalExperience,
      kuwaitExperience: user.candidateProfile.kuwaitExperience,
      gccExperience: user.candidateProfile.gccExperience || 0,
      partTimeSalary: user.candidateProfile.partTimeSalary,
      fullTimeSalary: user.candidateProfile.fullTimeSalary,
      expectedSalary: user.candidateProfile.expectedSalary,
      maritalStatus: user.candidateProfile.maritalStatus,
      aboutMe: user.candidateProfile.aboutMe || 'No description provided',
      profileImageUrl: user.candidateProfile.profileImageUrl,
      averageRating: averageRating || 0,
      reviewCount: reviewCount,
      languages: user.candidateProfile.languages || [],
      skills: user.candidateProfile.skills || [],
      availability: user.candidateProfile.availability || [],
      status: user.candidateProfile.status,
      certifications: user.candidateProfile.certifications || [],
      // Include subscription status for frontend to show prompts
      hasActiveSubscription: hasSubscription,
    }

    return NextResponse.json({
      candidate,
      reviews,
    })
  } catch (error) {
    console.error('Error fetching candidate profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
