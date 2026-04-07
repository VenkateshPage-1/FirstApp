import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUserId } from '@/lib/get-user-id'

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json()

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment details' }, { status: 400 })
    }

    // Verify HMAC signature — this is the only proof of genuine Razorpay payment
    const body = `${razorpay_order_id}|${razorpay_payment_id}`
    const expectedSig = createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex')

    if (expectedSig !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    // Fetch payment record — also confirms order belongs to this user
    const { data: payment } = await admin
      .from('payments')
      .select('plan, status')
      .eq('razorpay_order_id', razorpay_order_id)
      .eq('user_id', userId)
      .single()

    if (!payment) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (payment.status === 'paid') return NextResponse.json({ error: 'Already processed' }, { status: 409 })

    // Calculate expiry
    const premiumUntil = new Date()
    if (payment.plan === 'annual') {
      premiumUntil.setFullYear(premiumUntil.getFullYear() + 1)
    } else {
      premiumUntil.setMonth(premiumUntil.getMonth() + 3)
    }

    // Mark payment paid
    await admin.from('payments').update({
      razorpay_payment_id,
      razorpay_signature,
      status: 'paid',
      updated_at: new Date().toISOString(),
    }).eq('razorpay_order_id', razorpay_order_id)

    // Grant premium on profile
    await admin.from('user_profiles').upsert({
      user_id: userId,
      is_premium: true,
      premium_until: premiumUntil.toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    return NextResponse.json({ success: true, premium_until: premiumUntil.toISOString() })
  } catch (err) {
    console.error('Verify error:', err)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
