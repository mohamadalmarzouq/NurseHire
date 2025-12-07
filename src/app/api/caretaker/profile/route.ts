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
    if (!payload || payload.role !== 'CARETAKER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('Care taker profile update request:', { userId: payload.id, body })
    
    const {
      name,
      age,
      totalExperience,
      kuwaitExperience,
      gccExperience,
      partTimeSalary,
      fullTimeSalary,
      expectedSalary,
      maritalStatus,
      aboutMe,
      phone,
      location,
      languages,
      skills,
      availability,
    } = body

    // Build update object - all fields are required to be sent from the form
    const updateData: any = {
      name: name || '',
      aboutMe: aboutMe || null,
      phone: phone || null,
      location: location || null,
      languages: Array.isArray(languages) ? languages : [],
      skills: Array.isArray(skills) ? skills : [],
      availability: Array.isArray(availability) ? availability : [],
    }

    // Handle numeric fields - these are required Int fields in the schema
    // Convert strings to integers, validate the result
    const parseToInt = (value: any, fieldName: string): number => {
      if (value === undefined || value === null || value === '') {
        console.warn(`${fieldName} is empty, this should not happen`)
        return 0
      }
      const parsed = parseInt(value.toString(), 10)
      if (isNaN(parsed)) {
        console.warn(`${fieldName} is not a valid number: ${value}`)
        return 0
      }
      return parsed
    }
    
    const parseToIntOrNull = (value: any, fieldName: string): number | null => {
      if (value === undefined || value === null || value === '') {
        return null
      }
      const parsed = parseInt(value.toString(), 10)
      if (isNaN(parsed)) {
        return null
      }
      return parsed
    }
    
    updateData.age = parseToInt(age, 'age')
    updateData.totalExperience = parseToInt(totalExperience, 'totalExperience')
    updateData.kuwaitExperience = parseToInt(kuwaitExperience, 'kuwaitExperience')
    updateData.gccExperience = parseToInt(gccExperience, 'gccExperience')
    updateData.partTimeSalary = parseToInt(partTimeSalary, 'partTimeSalary')
    updateData.fullTimeSalary = parseToInt(fullTimeSalary, 'fullTimeSalary')
    updateData.expectedSalary = parseToIntOrNull(expectedSalary, 'expectedSalary')
    updateData.maritalStatus = maritalStatus || null

    console.log('Updating care taker profile with data:', updateData)

    // Use upsert to create profile if it doesn't exist, or update if it does
    const updatedProfile = await prisma.careTakerProfile.upsert({
      where: { userId: payload.id },
      update: updateData,
      create: {
        userId: payload.id,
        ...updateData,
        // Set required fields with defaults if not provided
        age: updateData.age || 25,
        totalExperience: updateData.totalExperience || 0,
        kuwaitExperience: updateData.kuwaitExperience || 0,
        gccExperience: updateData.gccExperience || 0,
        partTimeSalary: updateData.partTimeSalary || 0,
        fullTimeSalary: updateData.fullTimeSalary || 0,
        profileImageUrl: updateData.profileImageUrl || null,
      },
    })

    console.log('Care taker profile updated successfully:', updatedProfile)

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
    })
  } catch (error: any) {
    console.error('Error updating care taker profile:', error)
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
    })
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    )
  }
}
