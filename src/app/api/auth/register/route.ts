import { NextRequest, NextResponse } from 'next/server'
import { hashPassword, generateToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email, password, role, name, ...profileData } = await request.json()

    if (!email || !password || !role || !name) {
      return NextResponse.json(
        { error: 'Email, password, role, and name are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user and profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role,
        },
      })

      // Create profile based on role
      let profile
      if (role === 'MOTHER') {
        profile = await tx.motherProfile.create({
          data: {
            userId: user.id,
            name,
            ...profileData,
          },
        })
      } else if (role === 'NURSE') {
        profile = await tx.nurseProfile.create({
          data: {
            userId: user.id,
            name,
            ...profileData,
          },
        })
      } else if (role === 'ADMIN') {
        profile = await tx.adminProfile.create({
          data: {
            userId: user.id,
            name,
          },
        })
      }

      return { user, profile }
    })

    const token = generateToken({
      id: result.user.id,
      email: result.user.email,
      role: result.user.role,
    })

    const response = NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        profile: result.profile,
      },
    })

    // Set HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return response
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
