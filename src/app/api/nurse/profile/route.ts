import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'NURSE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      age,
      totalExperience,
      kuwaitExperience,
      partTimeSalary,
      fullTimeSalary,
      aboutMe,
      phone,
      location,
      languages,
      availability,
    } = body

    // Update nurse profile
    const updateData: any = {
      name,
      aboutMe,
      phone,
      location,
      languages: languages || [],
      availability: availability || [],
    }

    if (age) updateData.age = parseInt(age)
    if (totalExperience) updateData.totalExperience = parseInt(totalExperience)
    if (kuwaitExperience) updateData.kuwaitExperience = parseInt(kuwaitExperience)
    if (partTimeSalary) updateData.partTimeSalary = parseFloat(partTimeSalary)
    if (fullTimeSalary) updateData.fullTimeSalary = parseFloat(fullTimeSalary)

    const updatedProfile = await prisma.nurseProfile.update({
      where: { userId: payload.id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
    })
  } catch (error) {
    console.error('Error updating nurse profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
