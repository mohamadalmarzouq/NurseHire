import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/banners/[id]/impression - Track banner impression
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Increment impression count
    await prisma.bannerAd.update({
      where: { id },
      data: {
        impressionCount: {
          increment: 1,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking banner impression:', error)
    return NextResponse.json(
      { error: 'Failed to track impression' },
      { status: 500 }
    )
  }
}
