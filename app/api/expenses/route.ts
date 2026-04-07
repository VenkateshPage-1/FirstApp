import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUserId } from '@/lib/get-user-id'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') // format: YYYY-MM
    const category = searchParams.get('category')

    const admin = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })

    let query = admin
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (month) {
      const start = `${month}-01`
      const end = new Date(new Date(start).getFullYear(), new Date(start).getMonth() + 1, 0)
        .toISOString()
        .split('T')[0]
      query = query.gte('date', start).lte('date', end)
    }

    if (category && category !== 'All') {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })

    return NextResponse.json({ expenses: data })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { amount, category, description, date, payment_method } = await request.json()

    if (!amount || !category || !date) {
      return NextResponse.json({ error: 'Amount, category and date are required' }, { status: 400 })
    }

    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 })
    }

    const admin = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })
    const { data, error } = await admin
      .from('expenses')
      .insert({
        user_id: userId,
        amount: Number(amount),
        category,
        description: description ?? '',
        date,
        payment_method: payment_method ?? 'Cash',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: 'Failed to save expense' }, { status: 500 })

    return NextResponse.json({ expense: data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
