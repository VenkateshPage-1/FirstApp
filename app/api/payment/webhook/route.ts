import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { createClient } from '@supabase/supabase-js'

// Razorpay sends webhooks for async events (e.g. payment captured after bank delay)
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-razorpay-signature') ?? ''

    const expectedSig = createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest('hex')

    if (expectedSig !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(body)
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    if (event.event === 'payment.captured') {
      const paymentEntity = event.payload.payment.entity
      const orderId = paymentEntity.order_id

      const { data: record } = await admin
        .from('payments')
        .select('user_id, plan, status')
        .eq('razorpay_order_id', orderId)
        .single()

      // Only process if not already handled by /verify
      if (record && record.status !== 'paid') {
        const premiumUntil = new Date()
        if (record.plan === 'annual') {
          premiumUntil.setFullYear(premiumUntil.getFullYear() + 1)
        } else {
          premiumUntil.setMonth(premiumUntil.getMonth() + 3)
        }

        await admin.from('payments').update({
          razorpay_payment_id: paymentEntity.id,
          status: 'paid',
          updated_at: new Date().toISOString(),
        }).eq('razorpay_order_id', orderId)

        await admin.from('user_profiles').upsert({
          user_id: record.user_id,
          is_premium: true,
          premium_until: premiumUntil.toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
      }
    }

    if (event.event === 'payment.failed') {
      const orderId = event.payload.payment.entity.order_id
      await admin.from('payments').update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      }).eq('razorpay_order_id', orderId)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
