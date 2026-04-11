import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUserId } from '@/lib/get-user-id'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
    const { data, error } = await admin.from('goals').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json({ goals: data ?? [] })
  } catch (err) {
    console.error('Goals GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { name, target_amount, saved_amount, target_date, emoji, notes } = await request.json()
    if (!name || !target_amount) return NextResponse.json({ error: 'Name and target amount required' }, { status: 400 })

    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
    const { data, error } = await admin.from('goals').insert({
      user_id: userId,
      name: name.trim(),
      target_amount: Number(target_amount),
      saved_amount: Number(saved_amount ?? 0),
      target_date: target_date || null,
      emoji: emoji || '🎯',
      notes: notes || null,
      status: 'active',
    }).select().single()

    if (error) throw error
    return NextResponse.json({ goal: data }, { status: 201 })
  } catch (err) {
    console.error('Goals POST error:', err)
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 })
  }
}
