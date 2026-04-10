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
      .from('loans')
      .select('*')
      .eq('user_id', userId)
      .order('given_date', { ascending: false })

    if (error) throw error
    return NextResponse.json({ loans: data ?? [] })
  } catch (err) {
    console.error('Loans GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch loans' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { person_name, amount, given_date, return_date, notes } = await request.json()
    if (!person_name || !amount) return NextResponse.json({ error: 'Name and amount required' }, { status: 400 })

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    const { data, error } = await admin.from('loans').insert({
      user_id: userId,
      person_name: person_name.trim(),
      amount: Number(amount),
      given_date: given_date || new Date().toISOString().split('T')[0],
      return_date: return_date || null,
      notes: notes || null,
      status: 'pending',
    }).select().single()

    if (error) throw error
    return NextResponse.json({ loan: data }, { status: 201 })
  } catch (err) {
    console.error('Loans POST error:', err)
    return NextResponse.json({ error: 'Failed to create loan' }, { status: 500 })
  }
}
