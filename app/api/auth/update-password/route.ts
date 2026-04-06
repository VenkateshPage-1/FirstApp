import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    const { access_token, password } = await request.json()

    if (!access_token || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    if (!/[A-Z]/.test(password)) {
      return NextResponse.json({ error: 'Password must contain at least one uppercase letter' }, { status: 400 })
    }

    if (!/[0-9]/.test(password)) {
      return NextResponse.json({ error: 'Password must contain at least one number' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } })

    // Set the session using the token from the reset email link
    const { error: sessionError } = await supabase.auth.setSession({
      access_token,
      refresh_token: '',
    })

    if (sessionError) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })
    }

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      return NextResponse.json({ error: 'Failed to update password' }, { status: 400 })
    }

    return NextResponse.json({ message: 'Password updated successfully' })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
