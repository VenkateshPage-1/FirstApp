'use client'

import { useState } from 'react'

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Other']
const CAT_COLOR: Record<string, string> = {
  Food: '#f97316', Transport: '#06b6d4', Shopping: '#8b5cf6',
  Bills: '#ec4899', Health: '#10b981', Entertainment: '#f59e0b', Other: '#94a3b8',
}
const CAT_BG: Record<string, string> = {
  Food: '#fff7ed', Transport: '#ecfeff', Shopping: '#f5f3ff',
  Bills: '#fdf2f8', Health: '#f0fdf4', Entertainment: '#fffbeb', Other: '#f8fafc',
}
const CAT_ICON: Record<string, string> = {
  Food: '🍽️', Transport: '🚗', Shopping: '🛍️',
  Bills: '📄', Health: '❤️', Entertainment: '🎬', Other: '📦',
}

interface Expense { id: string; amount: number; category: string; description: string; date: string }

const today = new Date().toISOString().split('T')[0]
const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() - n); return dt.toISOString().split('T')[0] }

const INITIAL: Expense[] = [
  { id: '1', amount: 450,  category: 'Food',          description: 'Lunch at cafe',     date: today   },
  { id: '2', amount: 350,  category: 'Transport',      description: 'Cab ride',          date: today   },
  { id: '3', amount: 1200, category: 'Shopping',       description: 'New clothes',       date: d(1)    },
  { id: '4', amount: 280,  category: 'Food',           description: 'Dinner',            date: d(1)    },
  { id: '5', amount: 2500, category: 'Bills',          description: 'Electricity bill',  date: d(2)    },
  { id: '6', amount: 800,  category: 'Health',         description: 'Pharmacy',          date: d(3)    },
  { id: '7', amount: 600,  category: 'Entertainment',  description: 'Movie tickets',     date: d(4)    },
  { id: '8', amount: 320,  category: 'Food',           description: 'Groceries',         date: d(5)    },
  { id: '9', amount: 180,  category: 'Transport',      description: 'Auto rickshaw',     date: d(6)    },
]

const emptyForm = { amount: '', category: 'Food', description: '', date: today }

interface Props { onSignup: () => void; onLogin: () => void }

export default function DemoDashboard({ onSignup, onLogin }: Props) {
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL)
  const [showAddForm, setShowAddForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const now = new Date()
  const totalThisMonth = expenses.reduce((s, e) => s + e.amount, 0)
  const totalToday = expenses.filter(e => e.date === today).reduce((s, e) => s + e.amount, 0)

  const byCategory = CATEGORIES.map(cat => ({
    cat,
    total: expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0),
    count: expenses.filter(e => e.category === cat).length,
  })).filter(x => x.total > 0).sort((a, b) => b.total - a.total)

  const dailyTotals = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.date] = (acc[e.date] ?? 0) + e.amount; return acc
  }, {})
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(); dt.setDate(dt.getDate() - (6 - i))
    const key = dt.toISOString().split('T')[0]
    return { day: dt.toLocaleDateString('en', { weekday: 'short' }), key, amount: dailyTotals[key] ?? 0 }
  })
  const maxDay = Math.max(...last7Days.map(d => d.amount), 1)
  const avgPerDay = (() => {
    if (!expenses.length) return 0
    const days = new Set(expenses.map(e => e.date)).size
    return totalThisMonth / days
  })()
  const topCat = byCategory[0] ?? null
  const insights = [
    topCat && { text: `Most spent on ${topCat.cat} — ₹${topCat.total.toFixed(2)}`, color: CAT_COLOR[topCat.cat] },
    totalToday > 0 && { text: `Today's spending: ₹${totalToday.toFixed(2)}`, color: '#6366f1' },
    avgPerDay > 0 && { text: `Daily average: ₹${avgPerDay.toFixed(2)}`, color: '#06b6d4' },
    byCategory.length >= 3 && { text: `Spending across ${byCategory.length} categories`, color: '#8b5cf6' },
  ].filter(Boolean) as { text: string; color: string }[]

  const card = (extra?: React.CSSProperties): React.CSSProperties => ({
    background: 'white', borderRadius: '16px', padding: '20px 24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9',
    marginBottom: '14px', boxSizing: 'border-box', ...extra,
  })
  const lbl: React.CSSProperties = { fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }
  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', color: '#0f172a', outline: 'none', boxSizing: 'border-box' }

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    const newExp: Expense = { id: Date.now().toString(), amount: Number(form.amount), category: form.category, description: form.description, date: form.date }
    setExpenses(prev => [newExp, ...prev])
    setForm(emptyForm)
    setShowAddForm(false)
  }

  const filterMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'var(--font-inter), sans-serif', overflowX: 'hidden', width: '100%' }}>

      {/* Demo banner */}
      <div style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '13px', color: 'white', fontWeight: 500 }}>👀 Demo Mode — data resets when you leave</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={onSignup} style={{ background: 'white', color: '#6366f1', border: 'none', borderRadius: '7px', padding: '5px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            Create Free Account
          </button>
          <button onClick={onLogin} style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '7px', padding: '5px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Sign In
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="dash-nav" style={{ background: 'white', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <span style={{ fontWeight: 800, fontSize: '17px', color: '#6366f1', letterSpacing: '-0.5px' }}>TrackPenny</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg,#e0e7ff,#c7d2fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>👤</div>
          <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>Demo User</span>
        </div>
      </nav>

      <div className="dash-content dash-scroll-area" style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>

        {/* Summary */}
        <div className="dash-summary">
          {[
            { label: 'Today', value: `₹${totalToday.toFixed(2)}`, accent: '#6366f1' },
            { label: 'This Month', value: `₹${totalThisMonth.toFixed(2)}`, accent: '#8b5cf6' },
            { label: 'Transactions', value: String(expenses.length), accent: '#06b6d4' },
          ].map(({ label, value, accent }, idx) => (
            <div key={label} className={idx === 2 ? 'dash-summary-card-last' : ''} style={card({ padding: '20px 24px' })}>
              <p style={lbl}>{label}</p>
              <p style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', letterSpacing: '-1px', margin: '2px 0 0' }}>{value}</p>
              <div style={{ height: '3px', background: accent, borderRadius: '2px', marginTop: '14px', width: '36px' }} />
            </div>
          ))}
        </div>

        <div className="dash-grid">
          {/* LEFT */}
          <div>
            {/* Filter + Add */}
            <div style={card({ padding: '14px 18px' })}>
              <div className="filter-bar">
                <div style={{ minWidth: 0 }}>
                  <p style={lbl}>Month</p>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <select style={{ ...inp, flex: 1 }} disabled>
                      <option>{now.toLocaleDateString('en', { month: 'short' })}</option>
                    </select>
                    <select style={{ ...inp, width: '70px' }} disabled>
                      <option>{now.getFullYear()}</option>
                    </select>
                  </div>
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={lbl}>Category</p>
                  <select style={inp} disabled><option>All</option></select>
                </div>
                <button
                  onClick={() => setShowAddForm(v => !v)}
                  className="filter-add-btn"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '9px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                  {showAddForm ? '✕ Cancel' : '+ Add expense'}
                </button>
              </div>
            </div>

            {/* Add form */}
            {showAddForm && (
              <div className="fade-in" style={card({ borderLeft: '3px solid #6366f1' })}>
                <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>New expense</h3>
                <form onSubmit={handleAdd}>
                  <div className="expense-form-grid" style={{ display: 'grid', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <p style={lbl}>Amount (₹)</p>
                      <input type="number" min="0.01" step="0.01" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" style={inp} required autoFocus />
                    </div>
                    <div>
                      <p style={lbl}>Category</p>
                      <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={inp}>
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <p style={lbl}>Date</p>
                      <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} style={inp} required />
                    </div>
                    <div>
                      <p style={lbl}>Description</p>
                      <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="e.g. Lunch" style={inp} maxLength={200} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button type="submit" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Add (demo)
                    </button>
                    <button type="button" onClick={() => setShowAddForm(false)} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Cancel
                    </button>
                    <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '4px' }}>Won't be saved</span>
                  </div>
                </form>
              </div>
            )}

            {/* List */}
            <div style={card()}>
              <p style={{ ...lbl, marginBottom: '12px' }}>{expenses.length} records · {filterMonth}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                {expenses.map(expense => (
                  <div key={expense.id}>
                    <div style={{ padding: '11px 13px', background: CAT_BG[expense.category] || '#f8fafc', borderRadius: '10px', border: `1px solid ${CAT_COLOR[expense.category]}22` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: CAT_COLOR[expense.category] || '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', flexShrink: 0 }}>
                          {CAT_ICON[expense.category] || '📦'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a', marginBottom: '1px' }}>{expense.category}</p>
                          <p style={{ fontSize: '12px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {expense.description || '—'} · {expense.date}
                          </p>
                        </div>
                        <p style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a', flexShrink: 0 }}>₹{expense.amount.toFixed(2)}</p>
                      </div>
                      <div className="expense-actions" style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                        <button
                          onClick={() => setConfirmDeleteId(confirmDeleteId === expense.id ? null : expense.id)}
                          style={{ flex: 1, background: '#fef2f2', color: '#ef4444', border: 'none', padding: '4px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                          Delete
                        </button>
                      </div>
                    </div>
                    {confirmDeleteId === expense.id && (
                      <div style={{ padding: '10px 13px', background: '#fef2f2', borderRadius: '0 0 10px 10px', border: '1px solid #fee2e2', borderTop: 'none', marginTop: '-4px' }}>
                        <p style={{ fontSize: '13px', color: '#b91c1c', marginBottom: '8px' }}>Delete this expense?</p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => { setExpenses(prev => prev.filter(e => e.id !== expense.id)); setConfirmDeleteId(null) }}
                            style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '7px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Yes, delete</button>
                          <button onClick={() => setConfirmDeleteId(null)}
                            style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none', padding: '8px 12px', borderRadius: '7px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT — Analytics */}
          <div>
            <div style={card()}>
              <p style={{ ...lbl, marginBottom: '14px' }}>Breakdown</p>
              {byCategory.map(({ cat, total, count }) => {
                const pct = totalThisMonth > 0 ? (total / totalThisMonth) * 100 : 0
                return (
                  <div key={cat} style={{ marginBottom: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>{cat}</span>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>₹{total.toFixed(2)} <span style={{ color: '#cbd5e1' }}>({count})</span></span>
                    </div>
                    <div style={{ height: '5px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: CAT_COLOR[cat], borderRadius: '3px', transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={card()}>
              <p style={{ ...lbl, marginBottom: '14px' }}>Last 7 Days</p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '5px', height: '68px', marginBottom: '10px' }}>
                {last7Days.map(({ day, key, amount }) => (
                  <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ width: '100%', height: `${Math.max((amount / maxDay) * 52, amount > 0 ? 4 : 0)}px`, background: key === today ? '#6366f1' : '#e0e7ff', borderRadius: '4px 4px 0 0', transition: 'height 0.4s ease' }} />
                    <span style={{ fontSize: '10px', color: key === today ? '#6366f1' : '#94a3b8', fontWeight: key === today ? 700 : 400 }}>{day}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '9px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={lbl}>Daily avg</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>₹{avgPerDay.toFixed(2)}</span>
              </div>
            </div>

            <div style={card()}>
              <p style={{ ...lbl, marginBottom: '12px' }}>Insights</p>
              {insights.map((ins, i) => (
                <div key={i} style={{ display: 'flex', gap: '9px', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: ins.color, marginTop: '5px', flexShrink: 0 }} />
                  <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, margin: 0 }}>{ins.text}</p>
                </div>
              ))}
            </div>

            {/* Sign up CTA */}
            <div style={{ ...card({ background: 'linear-gradient(135deg,#eef2ff,#f5f3ff)', border: '1px solid #e0e7ff' }), textAlign: 'center', padding: '24px' }}>
              <p style={{ fontSize: '15px', fontWeight: 700, color: '#4338ca', marginBottom: '6px' }}>Ready to track real expenses?</p>
              <p style={{ fontSize: '13px', color: '#6366f1', marginBottom: '16px' }}>Your data saves securely — access anywhere</p>
              <button onClick={onSignup} style={{ width: '100%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                Create Free Account →
              </button>
              <button onClick={onLogin} style={{ width: '100%', background: 'none', color: '#6366f1', border: 'none', padding: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', marginTop: '6px' }}>
                Already have an account? Sign in
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="dash-bottom-nav">
        <button onClick={onSignup} className="active">
          <span style={{ fontSize: '18px' }}>✨</span>
          <span>Sign Up</span>
        </button>
        <button onClick={onLogin}>
          <span style={{ fontSize: '18px' }}>🔑</span>
          <span>Sign In</span>
        </button>
      </nav>
    </div>
  )
}
