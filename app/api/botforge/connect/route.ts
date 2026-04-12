import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUserId } from '@/lib/get-user-id'
import { randomBytes } from 'crypto'

const admin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

// Generate or retrieve BotForge API key
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const db = admin()

    // Check if user already has a key
    const { data: profile } = await db
      .from('user_profiles')
      .select('botforge_key')
      .eq('user_id', userId)
      .maybeSingle()

    if (profile?.botforge_key) {
      const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://trackpenny.com'}/api/botforge/webhook?key=${profile.botforge_key}`
      return NextResponse.json({ key: profile.botforge_key, webhook_url: webhookUrl })
    }

    // Generate new key
    const key = 'bf_' + randomBytes(16).toString('hex')

    await db
      .from('user_profiles')
      .update({ botforge_key: key, updated_at: new Date().toISOString() })
      .eq('user_id', userId)

    const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://trackpenny.com'}/api/botforge/webhook?key=${key}`
    return NextResponse.json({ key, webhook_url: webhookUrl })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// Revoke BotForge API key
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await admin()
      .from('user_profiles')
      .update({ botforge_key: null, updated_at: new Date().toISOString() })
      .eq('user_id', userId)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
