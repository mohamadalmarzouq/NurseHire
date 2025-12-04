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
      partTimeSalary,
      fullTimeSalary,
      aboutMe,
      phone,
      location,
      languages,
      availability,
    } = body

    // Build update object - all fields are required to be sent from the form
    const updateData: any = {
      name: name || '',
      aboutMe: aboutMe || null,
      phone: phone || null,
      location: location || null,
      languages: Array.isArray(languages) ? languages : [],
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
    
    updateData.age = parseToInt(age, 'age')
    updateData.totalExperience = parseToInt(totalExperience, 'totalExperience')
    updateData.kuwaitExperience = parseToInt(kuwaitExperience, 'kuwaitExperience')
    updateData.partTimeSalary = parseToInt(partTimeSalary, 'partTimeSalary')
    updateData.fullTimeSalary = parseToInt(fullTimeSalary, 'fullTimeSalary')

    console.log('Updating care taker profile with data:', updateData)

    const updatedProfile = await prisma.caretakerProfile.update({
      where: { userId: payload.id },
      data: updateData,
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
