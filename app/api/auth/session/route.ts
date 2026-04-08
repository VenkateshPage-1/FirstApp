import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'
import { getSession, getSessionForRefresh, updateSession } from '@/lib/session-store'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: NextRequest) {
  try {
    const cookieName = process.env.NODE_ENV === 'production' ? '__Host-session' : 'session'
    const sessionId = request.cookies.get(cookieName)?.value

    if (!sessionId) {
      return NextResponse.json({ user: null, authenticated: false }, { status: 200 })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    })

    // Try the access token first (fast path — no DB write needed)
    const session = await getSession(sessionId)

    if (session) {
      const { data: { user }, error } = await supabase.auth.getUser(session.access_token)

      if (!error && user) {
        return NextResponse.json({
          user: {
            id: user.id,
            email: user.email,
            username: user.user_metadata?.username || user.email?.split('@')[0],
          },
          authenticated: true,
        })
      }
    }

    // Access token expired — try refreshing using the refresh token
    const staleSession = await getSessionForRefresh(sessionId)

    if (!staleSession) {
      return NextResponse.json({ user: null, authenticated: false }, { status: 200 })
    }

    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession({
      refresh_token: staleSession.refresh_token,
    })

    if (refreshError || !refreshed.session) {
      return NextResponse.json({ user: null, authenticated: false }, { status: 200 })
    }

    // Save new tokens to DB
    await updateSession(
      sessionId,
      refreshed.session.access_token,
      refreshed.session.refresh_token,
      refreshed.session.expires_in
    )

    const user = refreshed.user
    return NextResponse.json({
      user: {
        id: user!.id,
        email: user!.email,
        username: user!.user_metadata?.username || user!.email?.split('@')[0],
      },
      authenticated: true,
    })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({ error: 'Failed to check session' }, { status: 500 })
  }
}
