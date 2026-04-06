import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession, getSessionForRefresh, updateSession } from './session-store'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function getAuthenticatedUserId(request: NextRequest): Promise<string | null> {
  const cookieName = process.env.NODE_ENV === 'production' ? '__Host-session' : 'session'
  const sessionId = request.cookies.get(cookieName)?.value
  if (!sessionId) return null

  const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } })

  let session = await getSession(sessionId)

  if (!session) {
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
