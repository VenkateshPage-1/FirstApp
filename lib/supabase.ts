import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Custom storage that does nothing (disables localStorage completely)
const noStorage = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: noStorage,
    autoRefreshToken: true,
    persistSession: false,
    detectSessionInUrl: true,
  },
})

