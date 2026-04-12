import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/', '/app', '/privacy', '/terms', '/reset-password', '/auth/callback']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith('/api/auth/') || pathname.startsWith('/api/telegram/') || pathname.startsWith('/api/botforge/webhook'))

  if (isPublic) return NextResponse.next()

  const cookieName = process.env.NODE_ENV === 'production' ? '__Host-session' : 'session'
  const sessionId = request.cookies.get(cookieName)?.value

  if (!sessionId) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:jpg|jpeg|png|gif|svg|ico|webp|mp4|woff2?|ttf|eot|otf)).*)'],
}
