import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUserId } from '@/lib/get-user-id'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { full_name, bio, phone, location, website, occupation, monthly_income, savings_goal_pct, category_budgets, emis } = await request.json()

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
        ...(monthly_income !== undefined && { monthly_income: Number(monthly_income) }),
        ...(savings_goal_pct !== undefined && { savings_goal_pct: Number(savings_goal_pct) }),
        ...(category_budgets !== undefined && { category_budgets }),
        ...(emis !== undefined && { emis }),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

    if (error) return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
