import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isRateLimited, recordFailedAttempt } from '@/lib/rate-limit'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      request.headers.get('x-real-ip') ??
      'unknown'

    if (await isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again in 15 minutes.' },
        { status: 429 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } })

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
    })

    if (error) {
      await recordFailedAttempt(ip)
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      message: 'If an account exists with that email, a reset link has been sent.',
    })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
