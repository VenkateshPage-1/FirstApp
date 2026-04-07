import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUserId } from '@/lib/get-user-id'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Ensure the expense belongs to this user before updating
    const { data, error } = await admin
      .from('expenses')
      .update({ amount: Number(amount), category, description: description ?? '', date, payment_method: payment_method ?? 'Cash' })
      .eq('id', params.id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Expense not found' }, { status: 404 })

    return NextResponse.json({ expense: data })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })

    // Ensure the expense belongs to this user before deleting
    const { error } = await admin
      .from('expenses')
      .delete()
      .eq('id', params.id)
      .eq('user_id', userId)

    if (error) return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
