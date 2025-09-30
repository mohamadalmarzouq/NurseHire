import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const cookie = request.cookies.get('auth-token')?.value
    console.log('Auth me cookie:', cookie ? 'present' : 'missing')
    
    if (!cookie) return NextResponse.json({ authenticated: false }, { status: 401 })

    const payload = verifyToken(cookie)
    console.log('Token payload:', payload)
    
    if (!payload) return NextResponse.json({ authenticated: false }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      include: { motherProfile: true, nurseProfile: true, adminProfile: true },
    })

    console.log('User found:', user ? 'yes' : 'no')

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
    console.error('Auth me error:', err)
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
}

