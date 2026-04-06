import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSession } from '@/lib/session-store'
import { isRateLimited, recordFailedAttempt, clearAttempts } from '@/lib/rate-limit'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      )
    }

    // Get client IP
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      request.headers.get('x-real-ip') ??
      'unknown'

    // Check rate limit before hitting Supabase
    if (await isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again in 15 minutes.' },
        { status: 429 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    })

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    })

    if (error || !data.session) {
      await recordFailedAttempt(ip)
      return NextResponse.json(
        { error: error?.message || 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Successful login — clear failed attempts for this IP
    await clearAttempts(ip)

    // Store the JWT server-side, get back an opaque session ID
    const sessionId = await createSession(
      data.user.id,
      data.session.access_token,
      data.session.refresh_token ?? '',
      data.session.expires_in
    )

    const response = NextResponse.json(
      {
        user: {
          id: data.user.id,
          email: data.user.email,
          username: data.user.user_metadata?.username || email.split('@')[0],
        },
      },
      { status: 200 }
    )

    const isProd = process.env.NODE_ENV === 'production'

    // Cookie holds only the random session ID — no JWT, no recognizable name
    // __Host- prefix enforced in production (requires HTTPS); plain name in dev (HTTP)
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
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    )
  }
}
