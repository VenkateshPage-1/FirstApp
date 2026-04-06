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

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Get client IP
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      request.headers.get('x-real-ip') ??
      'unknown'

    // Rate limit signup attempts per IP
    if (await isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again in 15 minutes.' },
        { status: 429 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    })

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password.trim(),
    })

    if (error) {
      await recordFailedAttempt(ip)
      // Don't reveal whether the email already exists
      return NextResponse.json(
        { error: 'Could not create account. Please try again.' },
        { status: 400 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Signup failed' },
        { status: 400 }
      )
    }

    await clearAttempts(ip)

    const isProd = process.env.NODE_ENV === 'production'

    // If email confirmation is disabled in Supabase, a session is returned immediately
    if (data.session?.access_token) {
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
            username: email.split('@')[0],
          },
          message: 'Account created successfully!',
        },
        { status: 201 }
      )

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
    }

    // Email confirmation is enabled — no session yet, just acknowledge
    return NextResponse.json(
      {
        user: null,
        message: 'Account created! Please check your email to confirm before logging in.',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'An error occurred during signup' },
      { status: 500 }
    )
  }
}
