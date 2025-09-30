import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const cookie = request.cookies.get('auth-token')?.value
    if (!cookie) return NextResponse.json({ authenticated: false }, { status: 401 })

    const payload = verifyToken(cookie)
    if (!payload) return NextResponse.json({ authenticated: false }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      include: { motherProfile: true, nurseProfile: true, adminProfile: true },
    })

    if (!user) return NextResponse.json({ authenticated: false }, { status: 401 })

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.motherProfile || user.nurseProfile || user.adminProfile,
      },
    })
  } catch (err) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
}

