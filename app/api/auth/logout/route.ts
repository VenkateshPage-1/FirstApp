import { NextRequest, NextResponse } from 'next/server'
import { deleteSession } from '@/lib/session-store'

export async function POST(request: NextRequest) {
  try {
    const cookieName = process.env.NODE_ENV === 'production' ? '__Host-session' : 'session'
    const sessionId = request.cookies.get(cookieName)?.value

    // Delete session from the database so the ID can't be reused
    if (sessionId) {
      await deleteSession(sessionId)
    }

    const response = NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    )

    response.cookies.set({
      name: cookieName,
      value: '',
      httpOnly: true,
      maxAge: 0,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'An error occurred during logout' },
      { status: 500 }
    )
  }
}
