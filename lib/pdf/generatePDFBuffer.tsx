import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@supabase/supabase-js'
import MonthlyReport, { ReportData } from './MonthlyReport'

/** Parse "report", "report last month", "report march", "report march 2025" etc. */
export function parseReportMonth(text: string): { year: number; month: number } {
  const now = new Date()
  const lower = text.toLowerCase()

  if (lower.includes('last month')) {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    return { year: d.getFullYear(), month: d.getMonth() + 1 }
  }

  const MONTHS = ['january','february','march','april','may','june','july','august','september','october','november','december']
  for (let i = 0; i < MONTHS.length; i++) {
    if (lower.includes(MONTHS[i])) {
      const yearMatch = text.match(/\b(20\d{2})\b/)
      const year = yearMatch ? parseInt(yearMatch[1]) : now.getFullYear()
      return { year, month: i + 1 }
    }
  }

  // Short month names
  const SHORT = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']
  for (let i = 0; i < SHORT.length; i++) {
    const re = new RegExp(`\\b${SHORT[i]}\\b`)
    if (re.test(lower)) {
      const yearMatch = text.match(/\b(20\d{2})\b/)
      const year = yearMatch ? parseInt(yearMatch[1]) : now.getFullYear()
      return { year, month: i + 1 }
    }
  }

  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

export async function generateReportForUser(userId: string, year: number, month: number): Promise<Buffer> {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const monthStr = `${year}-${String(month).padStart(2, '0')}`

  // Fetch everything in parallel
  const [
    { data: profileRow },
    { data: expenses },
    { data: goals },
    { data: loans },
  ] = await Promise.all([
    admin.from('user_profiles').select('*').eq('user_id', userId).maybeSingle(),
    admin.from('expenses').select('*').eq('user_id', userId).gte('date', `${monthStr}-01`).lte('date', `${monthStr}-31`),
    admin.from('goals').select('*').eq('user_id', userId),
    admin.from('loans').select('*').eq('user_id', userId).eq('status', 'pending'),
  ])

  const profile = profileRow ?? {}
  const loansGivenTotal = (loans ?? []).reduce((s: number, l: { amount: number }) => s + l.amount, 0)

  const data: ReportData = {
    userName: profile.full_name || 'TrackPenny User',
    month: monthStr,
    expenses: expenses ?? [],
    profile: {
      monthly_income: profile.monthly_income ?? 0,
      savings_goal_pct: profile.savings_goal_pct ?? 20,
      category_budgets: profile.category_budgets ?? {},
      emis: profile.emis ?? [],
      tax_investments: profile.tax_investments ?? {},
      assets: profile.assets ?? {},
      liabilities: profile.liabilities ?? {},
    },
    goals: (goals ?? []).map((g: { name: string; target_amount: number; saved_amount: number; emoji: string; status: string }) => ({
      name: g.name,
      target_amount: g.target_amount,
      saved_amount: g.saved_amount,
      emoji: g.emoji,
      status: g.status,
    })),
    loansGivenTotal,
  }

  return renderToBuffer(<MonthlyReport data={data} />)
}
