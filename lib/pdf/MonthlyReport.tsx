import {
  Document, Page, Text, View, StyleSheet, Font,
} from '@react-pdf/renderer'

// ── Styles ──────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1e293b',
    backgroundColor: '#ffffff',
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 40,
  },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingBottom: 16, borderBottomWidth: 2, borderBottomColor: '#6366f1' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandTrack: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#10b981' },
  brandPenny: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#6366f1' },
  headerRight: { alignItems: 'flex-end' },
  reportTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  reportSub: { fontSize: 9, color: '#64748b', marginTop: 2 },

  // Section
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#0f172a', marginBottom: 8, marginTop: 18 },
  sectionDivider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 10 },

  // Summary cards row
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  summaryCard: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  summaryLabel: { fontSize: 8, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  summaryValue: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  summaryNote: { fontSize: 7.5, color: '#94a3b8', marginTop: 2 },

  // Net worth special
  netWorthCard: { backgroundColor: '#0f172a', borderRadius: 10, padding: 14, marginBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  netWorthLabel: { fontSize: 9, color: '#94a3b8', marginBottom: 3 },
  netWorthValue: { fontSize: 22, fontFamily: 'Helvetica-Bold' },
  netWorthSubRow: { flexDirection: 'row', gap: 20, marginTop: 6 },
  netWorthSubItem: {},
  netWorthSubLabel: { fontSize: 8, color: '#64748b' },
  netWorthSubValue: { fontSize: 11, fontFamily: 'Helvetica-Bold' },

  // Category row
  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 7 },
  catDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  catLabel: { fontSize: 9, color: '#475569', flex: 1 },
  catAmount: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#0f172a', marginRight: 8, width: 55, textAlign: 'right' },
  catBarBg: { flex: 2, height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
  catBarFill: { height: '100%', borderRadius: 3 },
  catPct: { fontSize: 8, color: '#94a3b8', marginLeft: 6, width: 28, textAlign: 'right' },

  // Budget row
  budgetRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, padding: '6 8', backgroundColor: '#f8fafc', borderRadius: 6 },
  budgetLabel: { fontSize: 9, color: '#334155', flex: 1 },
  budgetSpent: { fontSize: 9, fontFamily: 'Helvetica-Bold', width: 55, textAlign: 'right' },
  budgetOf: { fontSize: 8, color: '#94a3b8', marginHorizontal: 4 },
  budgetTarget: { fontSize: 9, color: '#64748b', width: 55 },
  budgetStatus: { fontSize: 8, fontFamily: 'Helvetica-Bold', width: 40, textAlign: 'right' },

  // Expense row
  expenseRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  expenseCat: { fontSize: 8, color: '#64748b', width: 70 },
  expenseDesc: { fontSize: 9, color: '#334155', flex: 1 },
  expenseDate: { fontSize: 8, color: '#94a3b8', width: 50, textAlign: 'right' },
  expenseAmt: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#0f172a', width: 55, textAlign: 'right' },

  // Goal row
  goalRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, padding: '8 10', backgroundColor: '#f8fafc', borderRadius: 8 },
  goalEmoji: { fontSize: 14, marginRight: 8, width: 20 },
  goalInfo: { flex: 1 },
  goalName: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  goalSub: { fontSize: 8, color: '#64748b', marginTop: 1 },
  goalProgress: { alignItems: 'flex-end' },
  goalPct: { fontSize: 10, fontFamily: 'Helvetica-Bold' },
  goalAmt: { fontSize: 7.5, color: '#94a3b8', marginTop: 1 },

  // Tax row
  taxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  taxLabel: { fontSize: 9, color: '#334155', flex: 1 },
  taxAmt: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#0f172a' },

  // Insight box
  insightBox: { backgroundColor: '#0f172a', borderRadius: 10, padding: 14, marginTop: 14 },
  insightTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#f1f5f9', marginBottom: 6 },
  insightText: { fontSize: 9, color: '#94a3b8', lineHeight: 1.6 },
  insightHighlight: { color: '#a5b4fc', fontFamily: 'Helvetica-Bold' },

  // 50/30/20 bar
  splitRow: { flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden', marginBottom: 8 },

  // Footer
  footer: { position: 'absolute', bottom: 24, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 8 },
  footerLeft: { fontSize: 8, color: '#94a3b8' },
  footerRight: { fontSize: 8, color: '#94a3b8' },

  // Pill badge
  pill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  pillText: { fontSize: 7.5, fontFamily: 'Helvetica-Bold' },

  // Two column layout
  twoCol: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
})

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(1)}L`
  : n >= 1000 ? `₹${(n / 1000).toFixed(1)}K`
  : `₹${Math.round(n)}`

const fmtFull = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`

const CAT_COLORS: Record<string, string> = {
  Food: '#f97316', Transport: '#06b6d4', Shopping: '#8b5cf6',
  Bills: '#ec4899', Health: '#10b981', Entertainment: '#f59e0b', Other: '#94a3b8',
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

// ── Types ────────────────────────────────────────────────────────────────────

export interface ReportData {
  userName: string
  month: string // 'YYYY-MM'
  expenses: Array<{ id: string; amount: number; category: string; description: string; date: string; payment_method: string }>
  profile: {
    monthly_income: number
    savings_goal_pct: number
    category_budgets: Record<string, number>
    emis: Array<{ id: string; name: string; amount: number; months_remaining: number }>
    tax_investments?: Record<string, number>
    assets?: Record<string, number>
    liabilities?: Record<string, number>
  }
  goals: Array<{ name: string; target_amount: number; saved_amount: number; emoji: string; status: string }>
  loansGivenTotal: number
}

// ── Document ─────────────────────────────────────────────────────────────────

export default function MonthlyReport({ data }: { data: ReportData }) {
  const { userName, month, expenses, profile, goals, loansGivenTotal } = data
  const [yearStr, monthStr] = month.split('-')
  const monthName = MONTH_NAMES[parseInt(monthStr) - 1]
  const generatedOn = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

  // Calculations
  const income = profile.monthly_income ?? 0
  const savingsGoal = profile.savings_goal_pct ?? 20
  const emis = profile.emis ?? []
  const totalEMI = emis.reduce((s, e) => s + e.amount, 0)
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0)
  const savings = Math.max(0, income - totalSpent - totalEMI)
  const savingsRate = income > 0 ? (savings / income) * 100 : 0

  // Category breakdown
  const catTotals = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount
    return acc
  }, {})
  const sortedCats = Object.entries(catTotals).sort(([, a], [, b]) => b - a)
  const topCat = sortedCats[0]

  // Top 8 expenses
  const topExpenses = [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 8)

  // 50/30/20
  const NEEDS_CATS = ['Food', 'Bills', 'Health']
  const needsTotal = expenses.filter(e => NEEDS_CATS.includes(e.category)).reduce((s, e) => s + e.amount, 0)
  const wantsTotal = expenses.filter(e => !NEEDS_CATS.includes(e.category)).reduce((s, e) => s + e.amount, 0)
  const base = income > 0 ? income : totalSpent || 1
  const needsPct = Math.min(100, (needsTotal / base) * 100)
  const wantsPct = Math.min(100 - needsPct, (wantsTotal / base) * 100)
  const savPct = Math.max(0, 100 - needsPct - wantsPct)

  // Net worth
  const assets = profile.assets ?? {}
  const liabilities = profile.liabilities ?? {}
  const ASSET_KEYS = ['cash_bank','mutual_funds','ppf_epf','fd','gold','real_estate','vehicle','other_assets']
  const LIABILITY_KEYS = ['home_loan','car_loan','personal_loan','credit_card','education_loan','other_debt']
  const ASSET_LABELS: Record<string,string> = { cash_bank:'Cash & Bank', mutual_funds:'Mutual Funds', ppf_epf:'PPF / EPF', fd:'Fixed Deposits', gold:'Gold', real_estate:'Real Estate', vehicle:'Vehicle', other_assets:'Other' }
  const LIABILITY_LABELS: Record<string,string> = { home_loan:'Home Loan', car_loan:'Car Loan', personal_loan:'Personal Loan', credit_card:'Credit Card', education_loan:'Education Loan', other_debt:'Other Debt' }
  const totalAssets = ASSET_KEYS.reduce((s, k) => s + (assets[k] ?? 0), 0) + loansGivenTotal
  const totalLiabilities = LIABILITY_KEYS.reduce((s, k) => s + (liabilities[k] ?? 0), 0)
  const netWorth = totalAssets - totalLiabilities
  const isPositiveNW = netWorth >= 0

  // Tax
  const taxInvest = profile.tax_investments ?? {}
  const TAX_LIMIT = 150000
  const totalTax = Object.values(taxInvest).reduce((s, v) => s + (v as number), 0)
  const TAX_LABELS: Record<string,string> = { ppf:'PPF', elss:'ELSS', lic:'LIC / Insurance', nps:'NPS', epf:'EPF', nsc:'NSC / FD' }
  const taxEntries = Object.entries(taxInvest).filter(([, v]) => (v as number) > 0)

  // Budget status
  const budgets = profile.category_budgets ?? {}
  const budgetCats = Object.entries(budgets).filter(([, v]) => (v as number) > 0)

  // Yearly projection
  const today = new Date()
  const dayOfMonth = month === today.toISOString().slice(0, 7) ? today.getDate() : new Date(parseInt(yearStr), parseInt(monthStr), 0).getDate()
  const dailyRate = dayOfMonth > 0 ? totalSpent / dayOfMonth : 0
  const yearlyProjection = Math.round(dailyRate * 365)

  // Health score
  const savingsScore = Math.min(35, income > 0 ? (savingsRate / savingsGoal) * 35 : 0)
  const budgetScore = budgetCats.length > 0
    ? (budgetCats.filter(([cat, budget]) => catTotals[cat] <= (budget as number)).length / budgetCats.length) * 35 : 17
  const consistencyScore = Math.min(15, (expenses.length / 10) * 15)
  const emiPct = income > 0 ? (totalEMI / income) * 100 : 0
  const emiHealthScore = emiPct <= 30 ? 15 : emiPct <= 40 ? 8 : 0
  const healthScore = Math.round(savingsScore + budgetScore + consistencyScore + emiHealthScore)
  const scoreLabel = healthScore >= 70 ? 'Excellent' : healthScore >= 40 ? 'Fair' : 'Needs Work'
  const scoreColor = healthScore >= 70 ? '#10b981' : healthScore >= 40 ? '#f59e0b' : '#ef4444'

  return (
    <Document title={`TrackPenny — ${monthName} ${yearStr} Report`} author="TrackPenny">
      {/* ══ PAGE 1 ══ */}
      <Page size="A4" style={S.page}>

        {/* Header */}
        <View style={S.header}>
          <View>
            <View style={S.brandRow}>
              <Text style={S.brandTrack}>Track</Text>
              <Text style={S.brandPenny}>Penny</Text>
            </View>
            <Text style={{ fontSize: 8, color: '#94a3b8', marginTop: 2 }}>Personal Finance · trackpenny.com</Text>
          </View>
          <View style={S.headerRight}>
            <Text style={S.reportTitle}>Monthly Financial Report</Text>
            <Text style={S.reportSub}>{monthName} {yearStr}</Text>
            <Text style={S.reportSub}>{userName}</Text>
            <Text style={{ ...S.reportSub, marginTop: 4, color: '#94a3b8' }}>Generated {generatedOn}</Text>
          </View>
        </View>

        {/* Net Worth banner */}
        {(totalAssets > 0 || totalLiabilities > 0) && (
          <View style={S.netWorthCard}>
            <View>
              <Text style={S.netWorthLabel}>NET WORTH</Text>
              <Text style={{ ...S.netWorthValue, color: isPositiveNW ? '#34d399' : '#f87171' }}>
                {isPositiveNW ? '' : '−'}{fmtFull(Math.abs(netWorth))}
              </Text>
              <View style={S.netWorthSubRow}>
                <View style={S.netWorthSubItem}>
                  <Text style={S.netWorthSubLabel}>Total Assets</Text>
                  <Text style={{ ...S.netWorthSubValue, color: '#34d399' }}>{fmtFull(totalAssets)}</Text>
                </View>
                <View style={S.netWorthSubItem}>
                  <Text style={S.netWorthSubLabel}>Total Liabilities</Text>
                  <Text style={{ ...S.netWorthSubValue, color: '#f87171' }}>{fmtFull(totalLiabilities)}</Text>
                </View>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <View style={{ ...S.pill, backgroundColor: scoreColor + '30' }}>
                <Text style={{ ...S.pillText, color: scoreColor }}>Health {healthScore}/100</Text>
              </View>
              <Text style={{ fontSize: 8, color: '#64748b', marginTop: 4 }}>{scoreLabel}</Text>
            </View>
          </View>
        )}

        {/* Summary row */}
        <View style={S.summaryRow}>
          <View style={S.summaryCard}>
            <Text style={S.summaryLabel}>Income</Text>
            <Text style={S.summaryValue}>{income > 0 ? fmt(income) : '—'}</Text>
            <Text style={S.summaryNote}>This month</Text>
          </View>
          <View style={S.summaryCard}>
            <Text style={S.summaryLabel}>Total Spent</Text>
            <Text style={{ ...S.summaryValue, color: '#ef4444' }}>{fmt(totalSpent)}</Text>
            <Text style={S.summaryNote}>{expenses.length} transactions</Text>
          </View>
          <View style={S.summaryCard}>
            <Text style={S.summaryLabel}>Saved</Text>
            <Text style={{ ...S.summaryValue, color: '#10b981' }}>{income > 0 ? fmt(savings) : '—'}</Text>
            <Text style={S.summaryNote}>{income > 0 ? `${savingsRate.toFixed(0)}% of income` : 'Set income to calculate'}</Text>
          </View>
          {totalEMI > 0 && (
            <View style={S.summaryCard}>
              <Text style={S.summaryLabel}>EMIs</Text>
              <Text style={{ ...S.summaryValue, color: '#f59e0b' }}>{fmt(totalEMI)}</Text>
              <Text style={S.summaryNote}>/month · {emis.length} loan{emis.length > 1 ? 's' : ''}</Text>
            </View>
          )}
        </View>

        {/* 50/30/20 split bar */}
        {totalSpent > 0 && (
          <>
            <Text style={S.sectionTitle}>50/30/20 Spend Split</Text>
            <View style={S.sectionDivider} />
            <View style={S.splitRow}>
              <View style={{ width: `${needsPct}%`, backgroundColor: '#6366f1' }} />
              <View style={{ width: `${wantsPct}%`, backgroundColor: '#f59e0b' }} />
              <View style={{ flex: 1, backgroundColor: '#10b981' }} />
            </View>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              {[
                { label: 'Needs', pct: needsPct, amt: needsTotal, color: '#6366f1', ideal: '50%' },
                { label: 'Wants', pct: wantsPct, amt: wantsTotal, color: '#f59e0b', ideal: '30%' },
                { label: 'Savings', pct: savPct, amt: savings, color: '#10b981', ideal: '20%' },
              ].map(({ label, pct, amt, color, ideal }) => (
                <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
                  <Text style={{ fontSize: 8, color: '#475569' }}>{label}: </Text>
                  <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color }}>{pct.toFixed(0)}%</Text>
                  <Text style={{ fontSize: 8, color: '#94a3b8' }}> ({fmtFull(amt)}, ideal {ideal})</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Category breakdown */}
        {sortedCats.length > 0 && (
          <>
            <Text style={S.sectionTitle}>Spending by Category</Text>
            <View style={S.sectionDivider} />
            {sortedCats.map(([cat, amt]) => {
              const pct = totalSpent > 0 ? (amt / totalSpent) * 100 : 0
              const color = CAT_COLORS[cat] ?? '#94a3b8'
              return (
                <View key={cat} style={S.catRow}>
                  <View style={{ ...S.catDot, backgroundColor: color }} />
                  <Text style={S.catLabel}>{cat}</Text>
                  <Text style={S.catAmount}>{fmtFull(amt)}</Text>
                  <View style={S.catBarBg}>
                    <View style={{ ...S.catBarFill, width: `${pct}%`, backgroundColor: color }} />
                  </View>
                  <Text style={S.catPct}>{pct.toFixed(0)}%</Text>
                </View>
              )
            })}
          </>
        )}

        {/* Budget vs Actual */}
        {budgetCats.length > 0 && (
          <>
            <Text style={S.sectionTitle}>Budget vs Actual</Text>
            <View style={S.sectionDivider} />
            {budgetCats.map(([cat, budget]) => {
              const spent = catTotals[cat] ?? 0
              const over = spent > (budget as number)
              const pct = budget ? (spent / (budget as number)) * 100 : 0
              return (
                <View key={cat} style={S.budgetRow}>
                  <Text style={S.budgetLabel}>{cat}</Text>
                  <Text style={{ ...S.budgetSpent, color: over ? '#ef4444' : '#0f172a' }}>{fmtFull(spent)}</Text>
                  <Text style={S.budgetOf}>of</Text>
                  <Text style={S.budgetTarget}>{fmtFull(budget as number)}</Text>
                  <View style={{ ...S.pill, backgroundColor: over ? '#fee2e2' : '#f0fdf4' }}>
                    <Text style={{ ...S.pillText, color: over ? '#dc2626' : '#16a34a' }}>{over ? `${Math.round(pct - 100)}% over` : '✓ OK'}</Text>
                  </View>
                </View>
              )
            })}
          </>
        )}

        {/* Footer */}
        <View style={S.footer} fixed>
          <Text style={S.footerLeft}>TrackPenny · {monthName} {yearStr} Report · {userName}</Text>
          <Text style={S.footerRight} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>

      {/* ══ PAGE 2 ══ */}
      <Page size="A4" style={S.page}>

        {/* Top Expenses */}
        {topExpenses.length > 0 && (
          <>
            <Text style={S.sectionTitle}>Top Transactions</Text>
            <View style={S.sectionDivider} />
            <View style={{ flexDirection: 'row', paddingBottom: 4, marginBottom: 2 }}>
              <Text style={{ ...S.expenseCat, color: '#94a3b8' }}>CATEGORY</Text>
              <Text style={{ ...S.expenseDesc, color: '#94a3b8', fontSize: 8 }}>DESCRIPTION</Text>
              <Text style={{ ...S.expenseDate, color: '#94a3b8', fontSize: 8 }}>DATE</Text>
              <Text style={{ ...S.expenseAmt, color: '#94a3b8', fontSize: 8 }}>AMOUNT</Text>
            </View>
            {topExpenses.map((e, i) => (
              <View key={e.id ?? i} style={S.expenseRow}>
                <View style={{ width: 70, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: CAT_COLORS[e.category] ?? '#94a3b8' }} />
                  <Text style={{ ...S.expenseCat, width: 'auto' }}>{e.category}</Text>
                </View>
                <Text style={S.expenseDesc}>{(e.description || '—').slice(0, 40)}</Text>
                <Text style={S.expenseDate}>{e.date}</Text>
                <Text style={S.expenseAmt}>{fmtFull(e.amount)}</Text>
              </View>
            ))}
          </>
        )}

        {/* Savings Goals */}
        {goals.length > 0 && (
          <>
            <Text style={S.sectionTitle}>Savings Goals</Text>
            <View style={S.sectionDivider} />
            {goals.slice(0, 6).map((g, i) => {
              const pct = g.target_amount > 0 ? Math.min(100, (g.saved_amount / g.target_amount) * 100) : 0
              const isCompleted = g.status === 'completed'
              const color = isCompleted ? '#10b981' : '#6366f1'
              return (
                <View key={i} style={S.goalRow}>
                  <Text style={S.goalEmoji}>{g.emoji}</Text>
                  <View style={S.goalInfo}>
                    <Text style={S.goalName}>{g.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <View style={{ flex: 1, height: 5, backgroundColor: '#e2e8f0', borderRadius: 3 }}>
                        <View style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: 3 }} />
                      </View>
                      <Text style={{ fontSize: 7.5, color: '#64748b' }}>{fmtFull(g.saved_amount)} / {fmtFull(g.target_amount)}</Text>
                    </View>
                  </View>
                  <View style={S.goalProgress}>
                    <Text style={{ ...S.goalPct, color }}>{pct.toFixed(0)}%</Text>
                    {isCompleted && <Text style={{ fontSize: 7, color: '#10b981', marginTop: 1 }}>Done!</Text>}
                  </View>
                </View>
              )
            })}
          </>
        )}

        {/* 80C Tax Investments */}
        {taxEntries.length > 0 && (
          <>
            <Text style={S.sectionTitle}>80C Tax Investments</Text>
            <View style={S.sectionDivider} />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                {taxEntries.map(([key, val]) => (
                  <View key={key} style={S.taxRow}>
                    <Text style={S.taxLabel}>{TAX_LABELS[key] ?? key}</Text>
                    <Text style={S.taxAmt}>{fmtFull(val as number)}</Text>
                  </View>
                ))}
              </View>
              <View style={{ width: 120, backgroundColor: '#f0fdf4', borderRadius: 8, padding: 10 }}>
                <Text style={{ fontSize: 8, color: '#64748b', marginBottom: 4 }}>Invested of ₹1.5L limit</Text>
                <Text style={{ fontSize: 16, fontFamily: 'Helvetica-Bold', color: totalTax >= TAX_LIMIT ? '#10b981' : '#0f172a' }}>{fmtFull(totalTax)}</Text>
                <View style={{ height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, marginTop: 6 }}>
                  <View style={{ width: `${Math.min(100, (totalTax / TAX_LIMIT) * 100)}%`, height: '100%', backgroundColor: totalTax >= TAX_LIMIT ? '#10b981' : '#6366f1', borderRadius: 3 }} />
                </View>
                <Text style={{ fontSize: 7.5, color: '#166534', marginTop: 5 }}>
                  Est. tax saved: {fmtFull(Math.round(Math.min(totalTax, TAX_LIMIT) * 0.3))} (30% slab)
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Net Worth Breakdown */}
        {(totalAssets > 0 || totalLiabilities > 0) && (
          <>
            <Text style={S.sectionTitle}>Net Worth Breakdown</Text>
            <View style={S.sectionDivider} />
            <View style={S.twoCol}>
              <View style={S.col}>
                <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#16a34a', marginBottom: 6 }}>Assets</Text>
                {ASSET_KEYS.filter(k => (assets[k] ?? 0) > 0).map(k => (
                  <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 8.5, color: '#475569' }}>{ASSET_LABELS[k]}</Text>
                    <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#16a34a' }}>+{fmtFull(assets[k] as number)}</Text>
                  </View>
                ))}
                {loansGivenTotal > 0 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 8.5, color: '#475569' }}>Money lent out</Text>
                    <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#16a34a' }}>+{fmtFull(loansGivenTotal)}</Text>
                  </View>
                )}
                <View style={{ borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 4, marginTop: 4, flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#16a34a' }}>Total</Text>
                  <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#16a34a' }}>{fmtFull(totalAssets)}</Text>
                </View>
              </View>
              <View style={S.col}>
                <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#dc2626', marginBottom: 6 }}>Liabilities</Text>
                {LIABILITY_KEYS.filter(k => (liabilities[k] ?? 0) > 0).map(k => (
                  <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 8.5, color: '#475569' }}>{LIABILITY_LABELS[k]}</Text>
                    <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#dc2626' }}>−{fmtFull(liabilities[k] as number)}</Text>
                  </View>
                ))}
                {LIABILITY_KEYS.filter(k => (liabilities[k] ?? 0) > 0).length === 0 && (
                  <Text style={{ fontSize: 8.5, color: '#94a3b8', fontStyle: 'italic' }}>No liabilities recorded</Text>
                )}
                {totalLiabilities > 0 && (
                  <View style={{ borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 4, marginTop: 4, flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#dc2626' }}>Total</Text>
                    <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#dc2626' }}>{fmtFull(totalLiabilities)}</Text>
                  </View>
                )}
              </View>
            </View>
          </>
        )}

        {/* Insight / Action Plan */}
        <View style={S.insightBox}>
          <Text style={S.insightTitle}>💡 {monthName} {yearStr} — What this report tells you</Text>
          <Text style={S.insightText}>
            {income > 0
              ? `You earned ${fmtFull(income)} and spent ${fmtFull(totalSpent)} — saving ${savingsRate.toFixed(0)}% of your income.${savingsRate >= savingsGoal ? ` That beats your ${savingsGoal}% goal. ` : ` Your target was ${savingsGoal}%, ${fmtFull(Math.abs(savings - income * savingsGoal / 100))} ${savings < income * savingsGoal / 100 ? 'short' : 'ahead'}. `}${topCat ? `Your biggest category was ${topCat[0]} at ${fmtFull(topCat[1])} (${totalSpent > 0 ? ((topCat[1] / totalSpent) * 100).toFixed(0) : 0}% of spend).` : ''}`
              : `You recorded ${fmtFull(totalSpent)} in expenses across ${expenses.length} transactions.${topCat ? ` Biggest category: ${topCat[0]} (${fmtFull(topCat[1])}).` : ''} Add your monthly income in Settings to unlock full insights.`
            }
            {yearlyProjection > 0 ? `\n\nAt this pace you'll spend ${fmtFull(yearlyProjection)} this year.` : ''}
            {netWorth !== 0 ? `\n\nNet worth: ${isPositiveNW ? '+' : ''}${fmtFull(netWorth)}.${isPositiveNW ? ' Keep building.' : ' Focus on reducing liabilities.'}` : ''}
          </Text>
        </View>

        {/* Footer */}
        <View style={S.footer} fixed>
          <Text style={S.footerLeft}>TrackPenny · {monthName} {yearStr} Report · {userName}</Text>
          <Text style={S.footerRight} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
