import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUserId } from '@/lib/get-user-id'
import { randomBytes } from 'crypto'

const admin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

// Generate a connection code
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const db = admin()

    // Check if already connected
    const { data: profile } = await db
      .from('user_profiles')
      .select('telegram_chat_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (profile?.telegram_chat_id) {
      return NextResponse.json({ already_connected: true })
    }

    // Generate unique code, valid for 10 minutes
    const code = 'CONNECT-' + randomBytes(4).toString('hex').toUpperCase()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    // Remove any old codes for this user
    await db.from('telegram_connect_codes').delete().eq('user_id', userId)

    await db.from('telegram_connect_codes').insert({ code, user_id: userId, expires_at: expiresAt })

    return NextResponse.json({
      code,
      bot_username: process.env.TELEGRAM_BOT_USERNAME,
    })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// Disconnect Telegram
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await admin()
      .from('user_profiles')
      .update({ telegram_chat_id: null, updated_at: new Date().toISOString() })
      .eq('user_id', userId)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
