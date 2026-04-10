import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendMessage } from '@/lib/telegram'
import { parseExpense } from '@/lib/parse-expense'
import { parseLoan } from '@/lib/parse-loan'

// Telegram sends a GET to verify the webhook is alive
export async function GET() {
  return NextResponse.json({ ok: true })
}

export async function POST(request: NextRequest) {
  try {
    const update = await request.json()
    const message = update.message
    if (!message?.text) return NextResponse.json({ ok: true })

    const chatId = message.chat.id
    const text = message.text.trim()

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    // /start or /connect — show instructions
    if (text === '/start' || text === '/connect') {
      const { data: profile } = await admin
        .from('user_profiles')
        .select('user_id')
        .eq('telegram_chat_id', String(chatId))
        .maybeSingle()

      if (profile) {
        await sendMessage(chatId,
          '✅ Your TrackPenny account is already connected!\n\n' +
          'Send expenses like:\n' +
          '• 450 swiggy food\n' +
          '• 200 petrol\n' +
          '• 1500 electricity bill\n\n' +
          'I\'ll save them instantly.')
      } else {
        await sendMessage(chatId,
          '👋 Welcome to TrackPenny Bot!\n\n' +
          'To connect your account:\n' +
          '1. Open TrackPenny app\n' +
          '2. Go to <b>Profile → Connect Telegram</b>\n' +
          '3. Copy the code shown\n' +
          '4. Send it here\n\n' +
          'Once connected, just send expenses like "450 food swiggy" and I\'ll log them.')
      }
      return NextResponse.json({ ok: true })
    }

    // Connection code — CONNECT-XXXXXXXX
    if (text.startsWith('CONNECT-')) {
      const { data: codeRecord } = await admin
        .from('telegram_connect_codes')
        .select('user_id, expires_at')
        .eq('code', text)
        .maybeSingle()

      if (!codeRecord) {
        await sendMessage(chatId, '❌ Invalid code. Go to TrackPenny → Profile → Connect Telegram to get a new one.')
        return NextResponse.json({ ok: true })
      }

      if (new Date(codeRecord.expires_at) < new Date()) {
        await sendMessage(chatId, '⏰ Code expired. Go to TrackPenny → Profile → Connect Telegram to get a fresh one.')
        return NextResponse.json({ ok: true })
      }

      // Link telegram_chat_id to this user
      await admin.from('user_profiles').update({
        telegram_chat_id: String(chatId),
        updated_at: new Date().toISOString(),
      }).eq('user_id', codeRecord.user_id)

      // Clean up used code
      await admin.from('telegram_connect_codes').delete().eq('code', text)

      await sendMessage(chatId,
        '🎉 Connected! TrackPenny is now linked.\n\n' +
        'Send expenses anytime:\n' +
        '• <b>450 swiggy food</b>\n' +
        '• <b>200 petrol</b>\n' +
        '• <b>1500 electricity bill</b>\n' +
        '• <b>spent 800 on groceries</b>\n\n' +
        "I'll reply with a confirmation each time.")
      return NextResponse.json({ ok: true })
    }

    // Expense parsing — look up user by chat_id
    const { data: profile } = await admin
      .from('user_profiles')
      .select('user_id')
      .eq('telegram_chat_id', String(chatId))
      .maybeSingle()

    if (!profile) {
      await sendMessage(chatId,
        '⚠️ Account not connected yet.\n\n' +
        'Go to <b>TrackPenny → Profile → Connect Telegram</b> and send the code here.')
      return NextResponse.json({ ok: true })
    }

    const today = new Date()
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    // Try loan detection first
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
      await sendMessage(chatId, `🤝 Loan recorded — ₹${loan.amount} to ${loan.person_name} ${returnStr}`)
      return NextResponse.json({ ok: true })
    }

    // Fall back to expense parsing
    const expense = await parseExpense(text)

    if (!expense) {
      await sendMessage(chatId,
        "🤔 Couldn't read that.\n\n" +
        '<b>Expense:</b>\n' +
        '• 450 swiggy food\n' +
        '• 200 petrol\n\n' +
        '<b>Loan given:</b>\n' +
        '• gave 5000 venkatesh return 3 days\n' +
        '• lent 2000 ram return next week')
      return NextResponse.json({ ok: true })
    }

    await admin.from('expenses').insert({
      user_id: profile.user_id,
      amount: expense.amount,
      category: expense.category,
      description: expense.description,
      payment_method: 'UPI',
      date: dateStr,
    })

    const dateLabel = today.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    await sendMessage(chatId, `✅ Added ₹${expense.amount} · ${expense.category} · ${expense.description} · ${dateLabel}`)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Telegram webhook error:', err)
    return NextResponse.json({ ok: true }) // always 200 so Telegram doesn't retry
  }
}
