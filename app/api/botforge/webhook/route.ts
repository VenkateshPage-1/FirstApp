import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { parseExpense } from '@/lib/parse-expense'
import { parseLoan } from '@/lib/parse-loan'
import { parseSubscription } from '@/lib/parse-subscription'

// Health check
export async function GET() {
  return NextResponse.json({ ok: true, service: 'trackpenny-botforge' })
}

// Receive messages from BotForge
export async function POST(request: NextRequest) {
  try {
    const key = request.nextUrl.searchParams.get('key')
    if (!key) {
      return NextResponse.json({ text: 'Missing API key. Go to TrackPenny → Profile → Connect BotForge to get your webhook URL.' }, { status: 401 })
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    // Look up user by botforge_key
    const { data: profile } = await admin
      .from('user_profiles')
      .select('user_id')
      .eq('botforge_key', key)
      .maybeSingle()

    if (!profile) {
      return NextResponse.json({ text: 'Invalid API key. Go to TrackPenny → Profile → Connect BotForge to get a new key.' })
    }

    // Parse BotForge payload
    const body = await request.json()
    const text = body?.message?.text?.trim()

    if (!text) {
      return NextResponse.json({ text: '' })
    }

    const today = new Date()
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    // Handle "help" command
    if (text.toLowerCase() === 'help' || text.toLowerCase() === '/help') {
      return NextResponse.json({
        text:
          'TrackPenny Bot\n\n' +
          'Expense: "450 swiggy food"\n' +
          'Loan: "gave 5000 venkatesh return 3 days"\n' +
          'Subscription: "netflix 649 monthly"\n' +
          'Cancel: "cancel netflix"\n\n' +
          'Just type naturally and I\'ll log it!'
      })
    }

    // Handle "cancel <subscription>" command
    const cancelMatch = text.match(/^cancel\s+(.+)$/i)
    if (cancelMatch) {
      const subName = cancelMatch[1].trim()
      const { data: sub } = await admin
        .from('subscriptions')
        .select('id, name')
        .eq('user_id', profile.user_id)
        .ilike('name', `%${subName}%`)
        .eq('status', 'active')
        .maybeSingle()

      if (sub) {
        await admin.from('subscriptions').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', sub.id)
        return NextResponse.json({ text: `${sub.name} marked as cancelled.` })
      }
      return NextResponse.json({ text: `Couldn't find an active subscription matching "${subName}".` })
    }

    // Try subscription detection
    const sub = parseSubscription(text)
    if (sub) {
      const nextMonth = new Date()
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      const nextBillingDate = nextMonth.toISOString().split('T')[0]

      await admin.from('subscriptions').insert({
        user_id: profile.user_id,
        name: sub.name,
        amount: sub.amount,
        billing_cycle: sub.billing_cycle,
        next_billing_date: nextBillingDate,
        category: 'Bills',
        alert_days_before: 3,
        status: 'active',
      })

      return NextResponse.json({
        text: `Subscription added!\n${sub.name} · Rs.${sub.amount} · ${sub.billing_cycle}\nNext billing: ${new Date(nextBillingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
      })
    }

    // Try loan detection
    const loan = parseLoan(text)
    if (loan) {
      await admin.from('loans').insert({
        user_id: profile.user_id,
        person_name: loan.person_name,
        amount: loan.amount,
        given_date: dateStr,
        return_date: loan.return_date,
        status: 'pending',
      })

      const returnStr = loan.return_date
        ? `· return by ${new Date(loan.return_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
        : '· no return date'
      return NextResponse.json({ text: `Loan recorded — Rs.${loan.amount} to ${loan.person_name} ${returnStr}` })
    }

    // Try expense parsing
    const expense = await parseExpense(text)
    if (expense) {
      await admin.from('expenses').insert({
        user_id: profile.user_id,
        amount: expense.amount,
        category: expense.category,
        description: expense.description,
        payment_method: 'UPI',
        date: dateStr,
      })

      const dateLabel = today.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      return NextResponse.json({ text: `Added Rs.${expense.amount} · ${expense.category} · ${expense.description} · ${dateLabel}` })
    }

    // Nothing matched
    return NextResponse.json({
      text:
        "Couldn't read that.\n\n" +
        'Expense: "450 swiggy food"\n' +
        'Loan: "gave 5000 venkatesh return 3 days"\n' +
        'Subscription: "netflix 649 monthly"\n' +
        'Cancel: "cancel netflix"'
    })
  } catch (err) {
    console.error('BotForge webhook error:', err)
    return NextResponse.json({ text: 'Something went wrong. Please try again.' })
  }
}
