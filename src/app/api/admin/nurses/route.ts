import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const nurses = await prisma.user.findMany({
      where: { role: 'NURSE' },
      include: {
        nurseProfile: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      nurses: nurses.map(nurse => ({
        id: nurse.id,
        name: nurse.nurseProfile?.name || 'Unknown',
        email: nurse.email,
        totalExperience: nurse.nurseProfile?.totalExperience || 0,
        kuwaitExperience: nurse.nurseProfile?.kuwaitExperience || 0,
        partTimeSalary: nurse.nurseProfile?.partTimeSalary || 0,
        nightShiftSalary: nurse.nurseProfile?.nightShiftSalary || 0,
        aboutMe: nurse.nurseProfile?.aboutMe || '',
        languages: nurse.nurseProfile?.languages || [],
        availability: nurse.nurseProfile?.availability || [],
        cvUrl: nurse.nurseProfile?.cvUrl,
        profileImageUrl: nurse.nurseProfile?.profileImageUrl,
        status: nurse.nurseProfile?.status || 'PENDING',
        submittedAt: nurse.createdAt,
        age: nurse.nurseProfile?.age || 0,
      }))
    })
  } catch (error) {
    console.error('Error fetching nurses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
