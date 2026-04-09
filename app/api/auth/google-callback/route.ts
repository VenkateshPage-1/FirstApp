import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSession } from '@/lib/session-store'

export async function POST(request: NextRequest) {
  try {
    const { access_token, refresh_token, expires_in } = await request.json()
    if (!access_token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    )

    const { data: { user }, error } = await supabase.auth.getUser(access_token)
    if (error || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const sessionId = await createSession(
      user.id,
      access_token,
      refresh_token ?? '',
      expires_in ?? 3600
    )

    const isProd = process.env.NODE_ENV === 'production'
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
      },
    })

    response.cookies.set({
      name: isProd ? '__Host-session' : 'session',
      value: sessionId,
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: expires_in ?? 3600,
      path: '/',
    })

    return response
  } catch (err) {
    console.error('Google callback error:', err)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
