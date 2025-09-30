import { NextRequest, NextResponse } from 'next/server'
import { hashPassword, generateToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { baseRegisterSchema, motherProfileSchema, nurseProfileSchema } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Registration request body:', body)
    
    // Validate common fields
    const base = baseRegisterSchema.parse(body)
    const { email, password, role, name, confirmPassword } = base
    
    // Validate role-specific payload and build profileData
    let profileData: any = {}
    if (role === 'MOTHER') {
      profileData = motherProfileSchema.parse(body)
    } else if (role === 'NURSE') {
      profileData = nurseProfileSchema.parse(body)
    }

    if (!email || !password || !role || !name) {
      console.log('Missing required fields:', { email: !!email, password: !!password, role: !!role, name: !!name })
      return NextResponse.json(
        { error: 'Email, password, role, and name are required' },
        { status: 400 }
      )
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      )
    }

    // Check if user already exists
    let existingUser
    try {
      existingUser = await prisma.user.findUnique({
        where: { email },
      })
    } catch (dbError) {
      console.error('Database error checking existing user:', dbError)
      return NextResponse.json(
        { error: 'Database connection error. Please try again.' },
        { status: 500 }
      )
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user and profile in a transaction
    let result
    try {
      result = await prisma.$transaction(async (tx) => {
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
    } catch (dbError) {
      console.error('Database error creating user:', dbError)
      return NextResponse.json(
        { error: 'Failed to create account. Please try again.' },
        { status: 500 }
      )
    }

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
