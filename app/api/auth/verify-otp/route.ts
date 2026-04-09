import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSession } from '@/lib/session-store'

export async function POST(request: NextRequest) {
  try {
    const { email, token } = await request.json()
    if (!email || !token) return NextResponse.json({ error: 'Email and OTP required' }, { status: 400 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    )

    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: token.trim(),
      type: 'email',
    })

    if (error || !data.session) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 401 })
    }

    const sessionId = await createSession(
      data.user!.id,
      data.session.access_token,
      data.session.refresh_token ?? '',
      data.session.expires_in
    )

    const isProd = process.env.NODE_ENV === 'production'
    const response = NextResponse.json({
      user: {
        id: data.user!.id,
        email: data.user!.email,
        username: data.user!.user_metadata?.username || data.user!.email?.split('@')[0],
      },
    })

    response.cookies.set({
      name: isProd ? '__Host-session' : 'session',
      value: sessionId,
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: data.session.expires_in,
      path: '/',
    })

    return response
  } catch (err) {
    console.error('Verify OTP error:', err)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
