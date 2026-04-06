import { createClient } from '@supabase/supabase-js'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

const MAX_ATTEMPTS = 5
const WINDOW_MINUTES = 15

export async function isRateLimited(ip: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString()

  const { count } = await adminSupabase
    .from('login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('ip', ip)
    .gte('attempted_at', windowStart)

  return (count ?? 0) >= MAX_ATTEMPTS
}

export async function recordFailedAttempt(ip: string): Promise<void> {
  await adminSupabase.from('login_attempts').insert({ ip })
}

export async function clearAttempts(ip: string): Promise<void> {
  await adminSupabase.from('login_attempts').delete().eq('ip', ip)
}
