import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const protectedRoutes: Record<string, Array<'MOTHER' | 'NURSE' | 'ADMIN'>> = {
  '/mother': ['MOTHER'],
  '/nurse': ['NURSE'],
  '/admin': ['ADMIN'],
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only guard protected route prefixes
  const needsGuard = Object.keys(protectedRoutes).some((base) => pathname.startsWith(base))
  if (!needsGuard) return NextResponse.next()

  const token = request.cookies.get('auth-token')?.value
  if (!token) {
    const url = new URL('/auth/login', request.url)
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  const payload = verifyToken(token)
  if (!payload) {
    const url = new URL('/auth/login', request.url)
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  for (const base in protectedRoutes) {
    if (pathname.startsWith(base)) {
      const allowed = protectedRoutes[base]
      if (!allowed.includes(payload.role)) {
        const url = new URL('/', request.url)
        return NextResponse.redirect(url)
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/mother/:path*', '/nurse/:path*', '/admin/:path*'],
}


