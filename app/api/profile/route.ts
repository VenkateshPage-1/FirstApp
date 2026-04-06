import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession, getSessionForRefresh, updateSession } from '@/lib/session-store'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function getAuthenticatedUserId(request: NextRequest): Promise<string | null> {
  const cookieName = process.env.NODE_ENV === 'production' ? '__Host-session' : 'session'
  const sessionId = request.cookies.get(cookieName)?.value
  if (!sessionId) return null

  const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } })

  let session = await getSession(sessionId)

  if (!session) {
    // Try refresh
    const staleSession = await getSessionForRefresh(sessionId)
    if (!staleSession) return null

    const { data: refreshed, error } = await supabase.auth.refreshSession({
      refresh_token: staleSession.refresh_token,
    })
    if (error || !refreshed.session) return null

    await updateSession(sessionId, refreshed.session.access_token, refreshed.session.refresh_token, refreshed.session.expires_in)
    session = await getSession(sessionId)
    if (!session) return null
  }

  const { data: { user }, error } = await supabase.auth.getUser(session.access_token)
  if (error || !user) return null
  return user.id
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })
    const { data, error } = await admin
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    return NextResponse.json({ profile: data ?? null })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { full_name, bio, phone, location, website, occupation } = body

    const admin = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })
    const { error } = await admin
      .from('user_profiles')
      .upsert({
        user_id: userId,
        full_name: full_name ?? '',
        bio: bio ?? '',
        phone: phone ?? '',
        location: location ?? '',
        website: website ?? '',
        occupation: occupation ?? '',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

    if (error) {
      return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
