import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendMessage } from '@/lib/telegram'

// Called daily by Vercel cron — checks all active subscriptions and sends alerts
export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  // Fetch all active subscriptions with telegram connected
  const { data: subscriptions } = await admin
    .from('subscriptions')
    .select('*, user_profiles!inner(telegram_chat_id)')
    .eq('status', 'active')

  if (!subscriptions?.length) return NextResponse.json({ sent: 0 })

  let sent = 0

  for (const sub of subscriptions) {
    const chatId = sub.user_profiles?.telegram_chat_id
    if (!chatId) continue

    const billingDate = new Date(sub.next_billing_date)
    const daysUntil = Math.ceil((billingDate.getTime() - today.getTime()) / 86400000)

    // Send alert if within alert_days_before window
    if (daysUntil >= 0 && daysUntil <= sub.alert_days_before) {
      const dateLabel = billingDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      const cycleLabel = sub.billing_cycle === 'monthly' ? '/mo' : sub.billing_cycle === 'yearly' ? '/yr' : sub.billing_cycle === 'weekly' ? '/wk' : '/qtr'
      const cardLabel = sub.card_name ? ` · ${sub.card_name}` : ''

      let msg = ''
      if (daysUntil === 0) {
        msg = `🔔 <b>${sub.name}</b> bills <b>today</b> — ₹${sub.amount}${cycleLabel}${cardLabel}`
      } else if (daysUntil === 1) {
        msg = `⏰ <b>${sub.name}</b> bills <b>tomorrow</b> — ₹${sub.amount}${cycleLabel}${cardLabel}`
      } else {
        msg = `📅 <b>${sub.name}</b> bills in <b>${daysUntil} days</b> (${dateLabel}) — ₹${sub.amount}${cycleLabel}${cardLabel}`
      }

      if (sub.notes) msg += `\n<i>${sub.notes}</i>`
      msg += `\n\nReply <b>cancel ${sub.name.toLowerCase()}</b> to mark it cancelled.`

      await sendMessage(chatId, msg)
      sent++
    }

    // Auto-advance billing date if it has passed
    if (daysUntil < 0) {
      const next = new Date(sub.next_billing_date)
      if (sub.billing_cycle === 'monthly') next.setMonth(next.getMonth() + 1)
      else if (sub.billing_cycle === 'yearly') next.setFullYear(next.getFullYear() + 1)
      else if (sub.billing_cycle === 'weekly') next.setDate(next.getDate() + 7)
      else if (sub.billing_cycle === 'quarterly') next.setMonth(next.getMonth() + 3)

      await admin.from('subscriptions').update({
        next_billing_date: next.toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      }).eq('id', sub.id)
    }
  }

  console.log(`Subscription alerts: sent ${sent} of ${subscriptions.length}`)
  return NextResponse.json({ sent, total: subscriptions.length, date: todayStr })
}
