import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isRateLimited, recordFailedAttempt } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
    if (await isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many attempts. Please try again in 15 minutes.' }, { status: 429 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    )

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    })

    if (error) {
      await recordFailedAttempt(ip)
      return NextResponse.json({ error: 'Failed to send OTP. Please try again.' }, { status: 400 })
    }

    return NextResponse.json({ message: 'OTP sent' })
  } catch (err) {
    console.error('Send OTP error:', err)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
