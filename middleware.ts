import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/', '/api/auth/login', '/api/auth/signup', '/api/auth/session']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith('/api/auth/'))

  if (isPublic) return NextResponse.next()

  const cookieName = process.env.NODE_ENV === 'production' ? '__Host-session' : 'session'
  const sessionId = request.cookies.get(cookieName)?.value

  if (!sessionId) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
