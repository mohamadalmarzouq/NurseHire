import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, confirmPassword, role, name, ...otherData } = body

    // Validation
    if (!email || !password || !role || !name) {
      return NextResponse.json(
        { error: 'Email, password, role, and name are required' },
        { status: 400 }
      )
    }

    // Additional validation for nurses
    if (role === 'NURSE' && !otherData.profileImageUrl) {
      return NextResponse.json(
        { error: 'Profile picture is required for nurse registration' },
        { status: 400 }
      )
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user and profile
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
      },
    })

    let profile
    if (role === 'USER') {
      profile = await prisma.userProfile.create({
        data: {
          userId: user.id,
          name,
          phone: otherData.phone || null,
          location: otherData.location || null,
        },
      })
    } else if (role === 'NURSE') {
      profile = await prisma.nurseProfile.create({
        data: {
          userId: user.id,
          name,
          age: parseInt(otherData.age) || 25,
          totalExperience: parseInt(otherData.totalExperience) || 0,
          kuwaitExperience: parseInt(otherData.kuwaitExperience) || 0,
          partTimeSalary: parseInt(otherData.partTimeSalary) || 0,
          nightShiftSalary: parseInt(otherData.nightShiftSalary) || 0,
          aboutMe: otherData.aboutMe || null,
          cvUrl: otherData.cvUrl || null,
          profileImageUrl: otherData.profileImageUrl, // Required for nurses
          languages: otherData.languages || [],
          availability: otherData.availability || [],
        },
      })
    } else if (role === 'ADMIN') {
      profile = await prisma.adminProfile.create({
        data: {
          userId: user.id,
          name,
        },
      })
    }

    // Generate token
    const token = await generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    })

    // Prepare response
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile,
      },
    })

    // Set cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}
