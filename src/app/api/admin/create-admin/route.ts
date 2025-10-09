import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateToken } from '@/lib/auth'

// POST /api/admin/create-admin - Create admin account (one-time use)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    // Basic validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    // Check if any admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Admin account already exists' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'ADMIN',
      },
    })

    // Create admin profile
    const adminProfile = await prisma.adminProfile.create({
      data: {
        userId: adminUser.id,
        name,
      },
    })

    // Generate token
    const token = await generateToken({
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
    })

    return NextResponse.json({
      success: true,
      message: 'Admin account created successfully',
      user: {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        profile: adminProfile,
      },
      token,
    })
  } catch (error) {
    console.error('Error creating admin account:', error)
    return NextResponse.json(
      { error: 'Failed to create admin account' },
      { status: 500 }
    )
  }
}
