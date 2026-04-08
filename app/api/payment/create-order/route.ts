import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUserId } from '@/lib/get-user-id'

const PLANS = {
  quarterly: { amount: 9900, label: 'TrackPenny Premium' },  // ₹99
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { plan } = await request.json()
    if (!plan || !(plan in PLANS)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const { amount, label } = PLANS[plan as keyof typeof PLANS]

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })

    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `sw_${userId.slice(0, 8)}_${Date.now()}`,
      notes: { user_id: userId, plan },
    })

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    await admin.from('payments').insert({
      user_id: userId,
      razorpay_order_id: order.id,
      amount,
      plan,
      status: 'created',
    })

    return NextResponse.json({
      order_id: order.id,
      amount,
      currency: 'INR',
      key_id: process.env.RAZORPAY_KEY_ID!,
      label,
    })
  } catch (err) {
    console.error('Create order error:', err)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
