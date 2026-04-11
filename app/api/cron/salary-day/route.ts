import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendMessage } from '@/lib/telegram'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })

  const today = new Date()
  const todayDay = today.getDate()
  const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

  // Fetch users whose salary_day matches today
  const { data: profiles } = await admin
    .from('user_profiles')
    .select('user_id, telegram_chat_id, monthly_income, savings_goal_pct, category_budgets, emis, salary_day')
    .eq('salary_day', todayDay)
    .not('telegram_chat_id', 'is', null)
    .gt('monthly_income', 0)

  if (!profiles?.length) return NextResponse.json({ sent: 0 })

  let sent = 0

  for (const profile of profiles) {
    const chatId = profile.telegram_chat_id
    if (!chatId) continue

    const income = profile.monthly_income
    const savingsPct = profile.savings_goal_pct ?? 20
    const emis = profile.emis ?? []
    const totalEMI = emis.reduce((s: number, e: { amount: number }) => s + e.amount, 0)
    const budgets = profile.category_budgets ?? {}

    const savingsAmt = Math.round(income * savingsPct / 100)
    const disposable = income - totalEMI - savingsAmt

    // Build allocation plan
    const totalBudgeted = (Object.values(budgets) as number[]).reduce((s: number, v: number) => s + v, 0)
    const unbudgeted = Math.max(0, disposable - totalBudgeted)

    let allocationLines = ''
    if (totalEMI > 0) allocationLines += `🏦 EMI payments: <b>₹${totalEMI.toLocaleString('en-IN')}</b>\n`
    allocationLines += `💰 Save first: <b>₹${savingsAmt.toLocaleString('en-IN')}</b> (${savingsPct}%)\n`

    const budgetEntries = Object.entries(budgets).filter(([, v]) => (v as number) > 0)
    if (budgetEntries.length > 0) {
      allocationLines += `\n<b>Category budgets:</b>\n`
      budgetEntries.forEach(([cat, amt]) => {
        allocationLines += `  • ${cat}: ₹${(amt as number).toLocaleString('en-IN')}\n`
      })
    }

    if (unbudgeted > 0) allocationLines += `\n🎯 Remaining buffer: ₹${unbudgeted.toLocaleString('en-IN')}`

    // Check subscriptions due this month
    const { data: subs } = await admin
      .from('subscriptions')
      .select('name, amount, next_billing_date')
      .eq('user_id', profile.user_id)
      .eq('status', 'active')
      .gte('next_billing_date', `${month}-01`)
      .lte('next_billing_date', `${month}-31`)

    let subLine = ''
    if (subs && subs.length > 0) {
      const subTotal = subs.reduce((s: number, sub: { amount: number }) => s + sub.amount, 0)
      subLine = `\n📋 <b>Subscriptions due this month:</b> ${subs.map((s: { name: string }) => s.name).join(', ')} = ₹${subTotal.toLocaleString('en-IN')}`
    }

    const msg =
      `🎉 <b>Salary Day!</b> ₹${income.toLocaleString('en-IN')} received\n\n` +
      `<b>Your allocation plan:</b>\n${allocationLines}${subLine}\n\n` +
      `💡 Tip: Set aside savings <b>first</b> before spending — it's the #1 habit of people who build wealth.\n\n` +
      `<i>Open TrackPenny to track this month's expenses.</i>`

    await sendMessage(chatId, msg)
    sent++
  }

  return NextResponse.json({ sent })
}
