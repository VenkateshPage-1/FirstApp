import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendMessage } from '@/lib/telegram'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })

  const now = new Date()
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const dayOfMonth = now.getDate()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

  // Only run from day 10 onwards (enough data to be meaningful)
  if (dayOfMonth < 10) return NextResponse.json({ skipped: 'too early in month' })

  // Fetch all users with telegram connected and income set
  const { data: profiles } = await admin
    .from('user_profiles')
    .select('user_id, telegram_chat_id, monthly_income, category_budgets, savings_goal_pct')
    .not('telegram_chat_id', 'is', null)
    .gt('monthly_income', 0)

  if (!profiles?.length) return NextResponse.json({ sent: 0 })

  let sent = 0

  for (const profile of profiles) {
    const chatId = profile.telegram_chat_id
    if (!chatId) continue

    // Fetch this month's expenses
    const { data: expenses } = await admin
      .from('expenses')
      .select('amount, category, description')
      .eq('user_id', profile.user_id)
      .gte('date', `${month}-01`)
      .lte('date', `${month}-31`)

    if (!expenses?.length) continue

    const income = profile.monthly_income
    const savingsGoal = profile.savings_goal_pct ?? 20
    const budgets = profile.category_budgets ?? {}
    const totalSpent = expenses.reduce((s: number, e: { amount: number }) => s + e.amount, 0)

    // Projected month-end spend
    const dailyRate = totalSpent / dayOfMonth
    const projected = dailyRate * daysInMonth
    const projectedSavings = income - projected
    const targetSavings = income * (savingsGoal / 100)

    const alerts: string[] = []

    // Check overall overspend projection
    if (projected > income * 0.85) {
      const overspendAmt = Math.round(projected - income)
      alerts.push(`💸 At current pace, you'll spend <b>₹${Math.round(projected).toLocaleString('en-IN')}</b> this month — ${overspendAmt > 0 ? `₹${overspendAmt.toLocaleString('en-IN')} over income` : 'very close to your income'}.`)
    }

    // Check savings target
    if (projectedSavings < targetSavings * 0.5) {
      alerts.push(`📉 Projected savings: <b>₹${Math.max(0, Math.round(projectedSavings)).toLocaleString('en-IN')}</b> — well below your ${savingsGoal}% target.`)
    }

    // Check category budgets
    const catAlerts: string[] = []
    for (const [cat, budget] of Object.entries(budgets)) {
      if (!budget) continue
      const catSpent = expenses.filter((e: { category: string }) => e.category === cat).reduce((s: number, e: { amount: number }) => s + e.amount, 0)
      const pct = (catSpent / (budget as number)) * 100
      if (pct > 85) {
        catAlerts.push(`${pct >= 100 ? '🔴' : '🟡'} <b>${cat}</b>: ₹${catSpent.toLocaleString('en-IN')} / ₹${(budget as number).toLocaleString('en-IN')} (${Math.round(pct)}%)`)
      }
    }

    if (catAlerts.length > 0) {
      alerts.push(`\n<b>Budget alerts:</b>\n${catAlerts.join('\n')}`)
    }

    // Yearly projection insight
    const yearlyProjection = dailyRate * 365
    const topCat = Object.entries(
      expenses.reduce((acc: Record<string, number>, e: { category: string; amount: number }) => {
        acc[e.category] = (acc[e.category] ?? 0) + e.amount; return acc
      }, {})
    ).sort(([, a], [, b]) => b - a)[0]

    if (topCat) {
      const yearlyTopCat = (topCat[1] / dayOfMonth) * 365
      alerts.push(`\n📊 <b>Yearly projection:</b> You're on track to spend <b>₹${Math.round(yearlyProjection).toLocaleString('en-IN')}</b> this year. Your biggest category is <b>${topCat[0]}</b> — ₹${Math.round(yearlyTopCat).toLocaleString('en-IN')}/year.`)
    }

    if (alerts.length === 0) continue

    const msg = `📋 <b>TrackPenny Mid-Month Check</b>\n\n${alerts.join('\n')}\n\n<i>Open TrackPenny to see full details.</i>`
    await sendMessage(chatId, msg)
    sent++
  }

  return NextResponse.json({ sent, total: profiles.length })
}
