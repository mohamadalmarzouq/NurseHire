import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const protectedRoutes: Record<string, Array<'USER' | 'CARETAKER' | 'ADMIN'>> = {
  '/user': ['USER'],
  '/caretaker': ['CARETAKER'],
  '/admin': ['ADMIN'],
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for public routes
  const publicRoutes = ['/auth/login', '/auth/register']
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Only guard protected route prefixes
  const needsGuard = Object.keys(protectedRoutes).some((base) => pathname.startsWith(base))
  if (!needsGuard) return NextResponse.next()

  const token = request.cookies.get('auth-token')?.value
  console.log('Middleware check - pathname:', pathname, 'token present:', !!token)
  
  if (!token) {
    console.log('No token, redirecting to login')
    const url = new URL('/auth/login', request.url)
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  const payload = await verifyToken(token)
  console.log('Token payload:', payload)
  
  if (!payload) {
    console.log('Invalid token, redirecting to login')
    const url = new URL('/auth/login', request.url)
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  for (const base in protectedRoutes) {
    if (pathname.startsWith(base)) {
      const allowed = protectedRoutes[base]
      if (!allowed.includes(payload.role)) {
        console.log('Wrong role, redirecting to home')
        const url = new URL('/', request.url)
        return NextResponse.redirect(url)
      }
    }
  }

  console.log('Middleware check passed, allowing access')
  return NextResponse.next()
}

export const config = {
  matcher: ['/user/:path*', '/caretaker/:path*', '/admin/:path*'],
}


