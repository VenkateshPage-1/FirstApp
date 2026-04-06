import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'

// Service role client — never expose this key to the browser
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function createSession(
  userId: string,
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): Promise<string> {
  const sessionId = randomBytes(32).toString('base64url')
  const accessExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()
  const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days

  const { error } = await adminSupabase.from('sessions').insert({
    id: sessionId,
    user_id: userId,
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: accessExpiresAt,
    refresh_expires_at: refreshExpiresAt,
  })

  if (error) throw new Error('Failed to create session')
  return sessionId
}

// Returns session if access token is still valid
export async function getSession(sessionId: string) {
  const { data, error } = await adminSupabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error || !data) return null
  return data as SessionRow
}

// Returns session if refresh token is still valid (even if access token expired)
export async function getSessionForRefresh(sessionId: string) {
  const { data, error } = await adminSupabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .gt('refresh_expires_at', new Date().toISOString())
    .single()

  if (error || !data) return null
  return data as SessionRow
}

export async function updateSession(
  sessionId: string,
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): Promise<void> {
  const accessExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()
  const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  await adminSupabase
    .from('sessions')
    .update({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: accessExpiresAt,
      refresh_expires_at: refreshExpiresAt,
    })
    .eq('id', sessionId)
}

export async function deleteSession(sessionId: string): Promise<void> {
  await adminSupabase.from('sessions').delete().eq('id', sessionId)
}

type SessionRow = {
  id: string
  user_id: string
  access_token: string
  refresh_token: string
  expires_at: string
  refresh_expires_at: string
}
