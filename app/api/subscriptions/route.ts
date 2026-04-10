import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUserId } from '@/lib/get-user-id'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    const { data, error } = await admin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('next_billing_date', { ascending: true })

    if (error) throw error
    return NextResponse.json({ subscriptions: data ?? [] })
  } catch (err) {
    console.error('Subscriptions GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { name, amount, billing_cycle, next_billing_date, card_name, category, alert_days_before, notes } = await request.json()
    if (!name || !amount || !next_billing_date) {
      return NextResponse.json({ error: 'Name, amount and billing date required' }, { status: 400 })
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    const { data, error } = await admin.from('subscriptions').insert({
      user_id: userId,
      name: name.trim(),
      amount: Number(amount),
      billing_cycle: billing_cycle || 'monthly',
      next_billing_date,
      card_name: card_name || null,
      category: category || 'Bills',
      alert_days_before: alert_days_before ?? 3,
      notes: notes || null,
      status: 'active',
    }).select().single()

    if (error) throw error
    return NextResponse.json({ subscription: data }, { status: 201 })
  } catch (err) {
    console.error('Subscriptions POST error:', err)
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
  }
}
