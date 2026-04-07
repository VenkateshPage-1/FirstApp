'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000
const WARNING_BEFORE_MS = 60 * 1000
const CACHE_TTL_MS = 60 * 1000 // 1 minute cache per month/category
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

interface DashboardProps { username: string; onLogout: () => void }
interface Expense { id: string; amount: number; category: string; description: string; date: string }
interface ExpenseForm { amount: string; category: string; description: string; date: string }
interface UserProfile { full_name: string; bio: string; phone: string; location: string; website: string; occupation: string }

const emptyForm: ExpenseForm = {
  amount: '', category: 'Food', description: '',
  date: new Date().toISOString().split('T')[0],
}
const emptyProfile: UserProfile = {
  full_name: '', bio: '', phone: '', location: '', website: '', occupation: '',
}
type Tab = 'expenses' | 'profile'

// Simple in-memory cache
const cache: Record<string, { data: Expense[]; ts: number }> = {}

export default function Dashboard({ username, onLogout }: DashboardProps) {
  const [tab, setTab] = useState<Tab>('expenses')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showInactivityWarning, setShowInactivityWarning] = useState(false)

  const [initialLoading, setInitialLoading] = useState(true)
  const [signingOut, setSigningOut] = useState(false)
  const expensesReady = useRef(false)
  const profileReady = useRef(false)

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [expensesLoading, setExpensesLoading] = useState(true)
  const [expenseError, setExpenseError] = useState('')
  const [expenseSuccess, setExpenseSuccess] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [form, setForm] = useState<ExpenseForm>(emptyForm)
  const [isSavingExpense, setIsSavingExpense] = useState(false)
  const now = new Date()
  const [filterYear, setFilterYear] = useState(now.getFullYear())
  const [filterMonthNum, setFilterMonthNum] = useState(now.getMonth() + 1)
  const filterMonth = `${filterYear}-${String(filterMonthNum).padStart(2, '0')}`
  const [filterCategory, setFilterCategory] = useState('All')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const [userProfile, setUserProfile] = useState<UserProfile>(emptyProfile)
  const [profileForm, setProfileForm] = useState<UserProfile>(emptyProfile)
  const [profileLoading, setProfileLoading] = useState(true)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')

  const isLoggingOut = useRef(false)
  const handleLogout = useCallback(async () => {
    if (isLoggingOut.current) return
    isLoggingOut.current = true
    setSigningOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    onLogout()
  }, [onLogout])

  const resetInactivityTimer = useCallback(() => {
    setShowInactivityWarning(false)
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    if (warningTimer.current) clearTimeout(warningTimer.current)
    warningTimer.current = setTimeout(() => setShowInactivityWarning(true), INACTIVITY_TIMEOUT_MS - WARNING_BEFORE_MS)
    inactivityTimer.current = setTimeout(handleLogout, INACTIVITY_TIMEOUT_MS)
  }, [handleLogout])

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll']
    events.forEach(e => window.addEventListener(e, resetInactivityTimer))
    resetInactivityTimer()
    return () => {
      events.forEach(e => window.removeEventListener(e, resetInactivityTimer))
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
      if (warningTimer.current) clearTimeout(warningTimer.current)
    }
  }, [resetInactivityTimer])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const cacheKey = `${filterMonth}__${filterCategory}`

  const fetchExpenses = useCallback(async (force = false) => {
    // Serve from cache if fresh
    const cached = cache[cacheKey]
    if (!force && cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      setExpenses(cached.data)
      setExpensesLoading(false)
      expensesReady.current = true
      if (profileReady.current) setInitialLoading(false)
      return
    }

    setExpensesLoading(true)
    setExpenseError('')
    try {
      const params = new URLSearchParams({ month: filterMonth })
      if (filterCategory !== 'All') params.set('category', filterCategory)
      const res = await fetch(`/api/expenses?${params}`)
      if (res.status === 401) { handleLogout(); return }
      const data = await res.json()
      const list: Expense[] = data.expenses ?? []
      cache[cacheKey] = { data: list, ts: Date.now() }
      setExpenses(list)
    } catch {
      setExpenseError('Failed to load expenses')
    } finally {
      setExpensesLoading(false)
      expensesReady.current = true
      if (profileReady.current) setInitialLoading(false)
    }
  }, [filterMonth, filterCategory, handleLogout, cacheKey])

  useEffect(() => { fetchExpenses() }, [fetchExpenses])

  useEffect(() => {
    const fetchProfile = async () => {
      setProfileLoading(true)
      try {
        const res = await fetch('/api/profile')
        if (res.status === 401) { handleLogout(); return }
        const data = await res.json()
        if (data.profile) { setUserProfile(data.profile); setProfileForm(data.profile) }
      } catch {
        setProfileError('Failed to load profile')
      } finally {
        setProfileLoading(false)
        profileReady.current = true
        if (expensesReady.current) setInitialLoading(false)
      }
    }
    fetchProfile()
  }, [handleLogout])

  // ── Optimistic add / edit ──
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    setExpenseError('')

    const isEdit = !!editingExpense
    const tempId = `temp_${Date.now()}`
    const optimistic: Expense = {
      id: isEdit ? editingExpense!.id : tempId,
      amount: Number(form.amount),
      category: form.category,
      description: form.description,
      date: form.date,
    }

    // Optimistic update — instant UI
    if (isEdit) {
      setExpenses(prev => prev.map(e => e.id === editingExpense!.id ? optimistic : e))
    } else {
      setExpenses(prev => [optimistic, ...prev])
    }

    // Close form immediately
    setShowAddForm(false)
    setEditingExpense(null)
    setForm(emptyForm)
    setIsSavingExpense(true)

    try {
      const url = isEdit ? `/api/expenses/${editingExpense!.id}` : '/api/expenses'
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        // Rollback
        if (isEdit) {
          setExpenses(prev => prev.map(e => e.id === optimistic.id ? editingExpense! : e))
        } else {
          setExpenses(prev => prev.filter(e => e.id !== tempId))
        }
        setExpenseError(data.error || 'Failed to save')
        return
      }

      // Replace temp id with real id from server
      if (!isEdit && data.expense) {
        setExpenses(prev => prev.map(e => e.id === tempId ? data.expense : e))
        cache[cacheKey] = { data: [], ts: 0 } // invalidate cache
      }

      setExpenseSuccess(isEdit ? 'Updated!' : 'Added!')
      setTimeout(() => setExpenseSuccess(''), 2000)
    } catch {
      // Rollback
      if (isEdit) {
        setExpenses(prev => prev.map(e => e.id === optimistic.id ? editingExpense! : e))
      } else {
        setExpenses(prev => prev.filter(e => e.id !== tempId))
      }
      setExpenseError('An error occurred')
    } finally {
      setIsSavingExpense(false)
    }
  }

  // ── Optimistic delete ──
  const handleDeleteExpense = async (id: string) => {
    setConfirmDeleteId(null)
    setDeletingId(id)

    const deleted = expenses.find(e => e.id === id)!

    // Animate out then remove
    setTimeout(() => {
      setExpenses(prev => prev.filter(e => e.id !== id))
      setDeletingId(null)
      cache[cacheKey] = { data: [], ts: 0 } // invalidate cache
    }, 150)

    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        // Rollback
        setExpenses(prev => [deleted, ...prev])
        setExpenseError('Failed to delete')
      } else {
        setExpenseSuccess('Deleted!')
        setTimeout(() => setExpenseSuccess(''), 2000)
      }
    } catch {
      setExpenses(prev => [deleted, ...prev])
      setExpenseError('An error occurred')
    }
  }

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense)
    setForm({ amount: String(expense.amount), category: expense.category, description: expense.description, date: expense.date })
    setShowAddForm(true)
    setConfirmDeleteId(null)
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingProfile(true)
    setProfileError('')
    // Optimistic update
    const prev = userProfile
    setUserProfile(profileForm)
    setIsEditingProfile(false)
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      })
      const data = await res.json()
      if (!res.ok) {
        setUserProfile(prev) // rollback
        setIsEditingProfile(true)
        setProfileError(data.error || 'Failed to save')
        return
      }
      setProfileSuccess('Saved!')
      setTimeout(() => setProfileSuccess(''), 2000)
    } catch {
      setUserProfile(prev)
      setIsEditingProfile(true)
      setProfileError('An error occurred')
    } finally {
      setIsSavingProfile(false)
    }
  }

  // Analytics
  const totalThisMonth = expenses.reduce((s, e) => s + e.amount, 0)
  const today = new Date().toISOString().split('T')[0]
  const totalToday = expenses.filter(e => e.date === today).reduce((s, e) => s + e.amount, 0)
  const byCategory = CATEGORIES.map(cat => ({
    cat,
    total: expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0),
    count: expenses.filter(e => e.category === cat).length,
  })).filter(x => x.total > 0).sort((a, b) => b.total - a.total)

  const avgPerDay = (() => {
    if (!expenses.length) return 0
    const days = new Set(expenses.map(e => e.date)).size
    return totalThisMonth / days
  })()

  const dailyTotals = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.date] = (acc[e.date] ?? 0) + e.amount; return acc
  }, {})

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const key = d.toISOString().split('T')[0]
    return { day: d.toLocaleDateString('en', { weekday: 'short' }), key, amount: dailyTotals[key] ?? 0 }
  })
  const maxDay = Math.max(...last7Days.map(d => d.amount), 1)

  const topCategory = byCategory[0] ?? null
  const insights: { text: string; color: string }[] = []
  if (topCategory) insights.push({ text: `Most spent on ${topCategory.cat} — ₹${topCategory.total.toFixed(2)}`, color: CAT_COLOR[topCategory.cat] })
  if (totalToday > avgPerDay * 1.5 && avgPerDay > 0) insights.push({ text: `Today's spending is 50%+ above your daily average`, color: '#ef4444' })
  if (totalToday === 0) insights.push({ text: 'No spending recorded today', color: '#10b981' })
  if (byCategory.length >= 4) insights.push({ text: `Spending spread across ${byCategory.length} categories`, color: '#8b5cf6' })
  if (avgPerDay > 0) insights.push({ text: `Daily average this month: ₹${avgPerDay.toFixed(2)}`, color: '#06b6d4' })

  const centeredSpinner = (label: string) => (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', fontFamily: 'var(--font-inter),sans-serif' }}>
      <div style={{ width: '44px', height: '44px', borderRadius: '50%', border: '3px solid #e0e7ff', borderTopColor: '#6366f1', animation: 'spin 0.7s linear infinite' }} />
      <p style={{ fontSize: '13px', fontWeight: 500, color: '#94a3b8', letterSpacing: '0.02em' }}>{label}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (signingOut) return centeredSpinner('Signing out…')
  if (initialLoading) return centeredSpinner('Loading your dashboard…')

  const card = (extra?: React.CSSProperties): React.CSSProperties => ({
    background: 'white', borderRadius: '16px', padding: '20px 24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
    border: '1px solid #f1f5f9', marginBottom: '14px', ...extra,
  })

  const inp: React.CSSProperties = {
    width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0',
    borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit',
    color: '#0f172a', outline: 'none', boxSizing: 'border-box',
  }

  const btnClass = (type: 'primary' | 'danger' | 'ghost') =>
    `btn-ripple ${type === 'primary' ? 'btn-primary-anim' : type === 'danger' ? 'btn-danger-anim' : 'btn-ghost-anim'}`

  const btn = (bg: string, color = 'white', extra?: React.CSSProperties): React.CSSProperties => ({
    background: bg, color, border: 'none', padding: '7px 14px',
    borderRadius: '8px', fontSize: '13px', fontWeight: 600,
    fontFamily: 'inherit', cursor: 'pointer', ...extra,
  })

  const lbl: React.CSSProperties = {
    fontSize: '11px', fontWeight: 600, color: '#94a3b8',
    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px',
  }

  return (
    <div className="fade-in" style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'var(--font-inter), sans-serif' }}>

      {/* Inactivity banner */}
      {showInactivityWarning && (
        <div style={{ background: '#fef3c7', borderBottom: '1px solid #fde68a', padding: '8px 24px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', fontSize: '13px', color: '#92400e' }}>
          <span>You'll be logged out in 1 minute due to inactivity.</span>
          <button onClick={resetInactivityTimer} className={btnClass('ghost')} style={btn('#f59e0b', 'white', { padding: '4px 12px' })}>Stay logged in</button>
        </div>
      )}

      {/* Sticky nav */}
      <nav className="dash-nav" style={{ background: 'white', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          <span style={{ fontWeight: 800, fontSize: '17px', color: '#6366f1', letterSpacing: '-0.5px' }}>SpendWise</span>
          <div className="dash-nav-tabs" style={{ display: 'flex', gap: '2px' }}>
            {(['expenses', 'profile'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)} className="btn-pill"
                style={{ padding: '5px 14px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '13px', fontFamily: 'inherit', background: tab === t ? '#eef2ff' : 'transparent', color: tab === t ? '#6366f1' : '#64748b', textTransform: 'capitalize' }}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div ref={userMenuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowUserMenu(v => !v)}
            style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer' }}
            aria-label="User menu">
            {username[0]?.toUpperCase()}
          </button>

          {showUserMenu && (
            <div style={{ position: 'absolute', right: 0, top: '42px', background: 'white', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 8px 24px rgba(0,0,0,0.10)', minWidth: '200px', zIndex: 100, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>{username}</p>
                <p style={{ fontSize: '11px', color: '#94a3b8' }}>Signed in</p>
              </div>
              <div style={{ padding: '6px' }}>
                <button
                  onClick={() => { setShowUserMenu(false); setTab('profile') }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px', color: '#475569', fontFamily: 'inherit', textAlign: 'left' }}
                  onMouseOver={e => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseOut={e => (e.currentTarget.style.background = 'none')}>
                  <span>👤</span> Profile
                </button>
                <button
                  onClick={() => { setShowUserMenu(false); handleLogout() }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px', color: '#ef4444', fontFamily: 'inherit', textAlign: 'left' }}
                  onMouseOver={e => (e.currentTarget.style.background = '#fef2f2')}
                  onMouseOut={e => (e.currentTarget.style.background = 'none')}>
                  <span>↪</span> Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="dash-content dash-scroll-area" style={{ maxWidth: '1280px', margin: '0 auto' }}>

        {/* ── EXPENSES TAB ── */}
        {tab === 'expenses' && (
          <>
            {/* Summary row */}
            <div className="dash-summary">
              {[
                { label: "Today", value: `₹${totalToday.toFixed(2)}`, accent: '#6366f1' },
                { label: 'This month', value: `₹${totalThisMonth.toFixed(2)}`, accent: '#8b5cf6' },
                { label: 'Transactions', value: String(expenses.length), accent: '#06b6d4' },
              ].map(({ label, value, accent }, idx) => (
                <div key={label} className={idx === 2 ? 'dash-summary-card-last' : ''} style={card({ padding: '20px 24px' })}>
                  <p style={lbl}>{label}</p>
                  <p style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', letterSpacing: '-1px', margin: '2px 0 0' }}>{value}</p>
                  <div style={{ height: '3px', background: accent, borderRadius: '2px', marginTop: '14px', width: '36px' }} />
                </div>
              ))}
            </div>

            {expenseSuccess && (
              <div className="alert-success fade-in" style={{ marginBottom: '12px' }}>{expenseSuccess}</div>
            )}
            {expenseError && (
              <div className="alert-error fade-in" style={{ marginBottom: '12px' }}>{expenseError}</div>
            )}

            <div className="dash-grid">

              {/* LEFT */}
              <div>
                {/* Filter bar + add button */}
                <div style={card({ padding: '14px 18px', overflow: 'hidden' })}>
                  <div className="filter-bar">
                    <div style={{ minWidth: 0, overflow: 'hidden' }}>
                      <p style={lbl}>Month</p>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <select value={filterMonthNum} onChange={e => setFilterMonthNum(Number(e.target.value))} style={{ ...inp, flex: 1, minWidth: 0 }}>
                          {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                            <option key={i} value={i + 1}>{m}</option>
                          ))}
                        </select>
                        <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} style={{ ...inp, width: '72px', flexShrink: 0 }}>
                          {Array.from({ length: 4 }, (_, i) => now.getFullYear() - i).map(y => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div style={{ minWidth: 0, overflow: 'hidden' }}>
                      <p style={lbl}>Category</p>
                      <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ ...inp, display: 'block', width: '100%', maxWidth: '100%' }}>
                        <option>All</option>
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <button
                      onClick={() => { setShowAddForm(v => !v); setEditingExpense(null); setForm(emptyForm); setConfirmDeleteId(null) }}
                      className={`filter-add-btn ${btnClass('primary')}`}
                      style={btn('linear-gradient(135deg,#6366f1,#8b5cf6)', 'white', { padding: '10px 16px', borderRadius: '9px', flexShrink: 0 })}>
                      {showAddForm ? '✕ Cancel' : '+ Add expense'}
                    </button>
                  </div>
                </div>

                {/* Add / Edit form */}
                {showAddForm && (
                  <div className="fade-in" style={card({ borderLeft: '3px solid #6366f1' })}>
                    <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                      {editingExpense ? 'Edit expense' : 'New expense'}
                    </h3>
                    <form onSubmit={handleSaveExpense}>
                      <div className="expense-form-grid" style={{ display: 'grid', gap: '12px', marginBottom: '12px' }}>
                        <div>
                          <p style={lbl}>Amount (₹)</p>
                          <input type="number" min="0.01" step="0.01" value={form.amount}
                            onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                            placeholder="0.00" style={inp} required autoFocus />
                        </div>
                        <div>
                          <p style={lbl}>Category</p>
                          <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={inp}>
                            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                          </select>
                        </div>
                        <div>
                          <p style={lbl}>Date</p>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {(() => {
                              const [fy, fm, fd] = form.date.split('-').map(Number)
                              const daysInMonth = new Date(fy, fm, 0).getDate()
                              const setDatePart = (y: number, m: number, d: number) => {
                                const clampedD = Math.min(d, new Date(y, m, 0).getDate())
                                setForm(p => ({ ...p, date: `${y}-${String(m).padStart(2,'0')}-${String(clampedD).padStart(2,'0')}` }))
                              }
                              return <>
                                <select value={fd} onChange={e => setDatePart(fy, fm, Number(e.target.value))} style={{ ...inp, flex: '0 0 58px' }}>
                                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                                <select value={fm} onChange={e => setDatePart(fy, Number(e.target.value), fd)} style={{ ...inp, flex: 1, minWidth: 0 }}>
                                  {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                                </select>
                                <select value={fy} onChange={e => setDatePart(Number(e.target.value), fm, fd)} style={{ ...inp, flex: '0 0 70px' }}>
                                  {Array.from({ length: 4 }, (_, i) => now.getFullYear() - i).map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                              </>
                            })()}
                          </div>
                        </div>
                        <div>
                          <p style={lbl}>Description</p>
                          <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                            placeholder="e.g. Lunch at cafe" style={inp} maxLength={200} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="submit" className={btnClass('primary')} style={btn('linear-gradient(135deg,#6366f1,#8b5cf6)', 'white', { padding: '8px 18px' })} disabled={isSavingExpense}>
                          {isSavingExpense ? <span className="dot-loader"><span/><span/><span/></span> : editingExpense ? 'Update' : 'Save'}
                        </button>
                        <button type="button" className={btnClass('ghost')}
                          onClick={() => { setShowAddForm(false); setEditingExpense(null); setForm(emptyForm) }}
                          style={btn('#f1f5f9', '#64748b', { padding: '8px 18px' })}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Expenses list */}
                <div style={card()}>
                  {expensesLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                      {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: '58px', borderRadius: '10px' }} />)}
                    </div>
                  ) : expenses.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '44px 0', color: '#94a3b8' }}>
                      <div style={{ fontSize: '36px', marginBottom: '10px' }}>💸</div>
                      <p style={{ fontWeight: 600, color: '#475569', marginBottom: '3px' }}>No expenses yet</p>
                      <p style={{ fontSize: '13px' }}>Add your first expense above</p>
                    </div>
                  ) : (
                    <>
                      <p style={{ ...lbl, marginBottom: '12px' }}>{expenses.length} record{expenses.length !== 1 ? 's' : ''} · {filterMonth}</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                        {expenses.map(expense => (
                          <div key={expense.id}>
                            <div
                              className={`expense-row${deletingId === expense.id ? ' deleting' : ' adding'}`}
                              style={{ padding: '11px 13px', background: CAT_BG[expense.category] || '#f8fafc', borderRadius: '10px', border: `1px solid ${CAT_COLOR[expense.category]}22` }}>
                              {/* Top row: icon + text + amount */}
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
                              {/* Bottom row: action buttons */}
                              <div className="expense-actions" style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                                <button onClick={() => handleEditExpense(expense)}
                                  className={btnClass('ghost')}
                                  style={btn('#eef2ff', '#6366f1', { padding: '4px 12px', fontSize: '12px', flex: 1 })}>
                                  Edit
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(confirmDeleteId === expense.id ? null : expense.id)}
                                  className={btnClass('danger')}
                                  style={btn('#fef2f2', '#ef4444', { padding: '4px 12px', fontSize: '12px', flex: 1 })}>
                                  Delete
                                </button>
                              </div>
                            </div>

                            {/* Inline delete confirm — no blocking dialog */}
                            {confirmDeleteId === expense.id && (
                              <div className="delete-confirm" style={{ padding: '10px 13px', background: '#fef2f2', borderRadius: '0 0 10px 10px', border: '1px solid #fee2e2', borderTop: 'none', marginTop: '-4px' }}>
                                <p style={{ fontSize: '13px', color: '#b91c1c', marginBottom: '8px' }}>Delete this expense?</p>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button onClick={() => handleDeleteExpense(expense.id)}
                                    className={btnClass('danger')}
                                    style={btn('#ef4444', 'white', { padding: '8px 12px', fontSize: '13px', flex: 1 })}>
                                    Yes, delete
                                  </button>
                                  <button onClick={() => setConfirmDeleteId(null)}
                                    className={btnClass('ghost')}
                                    style={btn('#f1f5f9', '#64748b', { padding: '8px 12px', fontSize: '13px', flex: 1 })}>
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* RIGHT — Analytics */}
              <div>
                {/* Category breakdown */}
                <div style={card()}>
                  <p style={{ ...lbl, marginBottom: '14px' }}>Breakdown</p>
                  {byCategory.length === 0 ? (
                    <p style={{ fontSize: '13px', color: '#cbd5e1', textAlign: 'center', padding: '12px 0' }}>No data yet</p>
                  ) : byCategory.map(({ cat, total, count }) => {
                    const pct = totalThisMonth > 0 ? (total / totalThisMonth) * 100 : 0
                    return (
                      <div key={cat} style={{ marginBottom: '13px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>{cat}</span>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>₹{total.toFixed(2)} <span style={{ color: '#cbd5e1' }}>({count})</span></span>
                        </div>
                        <div style={{ height: '5px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                          <div className="progress-fill" style={{ height: '100%', width: `${pct}%`, background: CAT_COLOR[cat] || '#6366f1', borderRadius: '3px' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* 7-day chart */}
                <div style={card()}>
                  <p style={{ ...lbl, marginBottom: '14px' }}>Last 7 Days</p>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '5px', height: '68px', marginBottom: '10px' }}>
                    {last7Days.map(({ day, key, amount }) => (
                      <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                        <div
                          className="bar-fill"
                          title={`₹${amount.toFixed(2)}`}
                          style={{ width: '100%', height: `${Math.max((amount / maxDay) * 52, amount > 0 ? 4 : 0)}px`, background: key === today ? '#6366f1' : '#e0e7ff', borderRadius: '4px 4px 0 0' }}
                        />
                        <span style={{ fontSize: '10px', color: key === today ? '#6366f1' : '#94a3b8', fontWeight: key === today ? 700 : 400 }}>{day}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '9px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={lbl}>Daily avg</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>₹{avgPerDay.toFixed(2)}</span>
                  </div>
                </div>

                {/* Insights */}
                <div style={card()}>
                  <p style={{ ...lbl, marginBottom: '12px' }}>Insights</p>
                  {insights.length === 0 ? (
                    <p style={{ fontSize: '13px', color: '#cbd5e1' }}>Add expenses to see insights</p>
                  ) : insights.map((ins, i) => (
                    <div key={i} style={{ display: 'flex', gap: '9px', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: ins.color, marginTop: '5px', flexShrink: 0 }} />
                      <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, margin: 0 }}>{ins.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── PROFILE TAB ── */}
        {tab === 'profile' && (
          <div style={{ maxWidth: '640px' }}>
            <div style={card()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
                <div>
                  <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Profile</h2>
                  <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>Your personal information</p>
                </div>
                {!isEditingProfile && (
                  <button onClick={() => setIsEditingProfile(true)}
                    className={btnClass('primary')}
                    style={btn('linear-gradient(135deg,#6366f1,#8b5cf6)', 'white', { padding: '7px 16px' })}>
                    Edit
                  </button>
                )}
              </div>

              {profileError && <div className="alert-error">{profileError}</div>}
              {profileSuccess && <div className="alert-success fade-in">{profileSuccess}</div>}

              {profileLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '18px' }} />)}
                </div>
              ) : isEditingProfile ? (
                <form onSubmit={handleSaveProfile}>
                  <div className="profile-form-grid" style={{ display: 'grid', gap: '14px', marginBottom: '14px' }}>
                    {[
                      { id: 'full_name', label: 'Full Name', type: 'text', placeholder: 'Your full name' },
                      { id: 'occupation', label: 'Occupation', type: 'text', placeholder: 'What do you do?' },
                      { id: 'phone', label: 'Phone', type: 'tel', placeholder: 'Phone number' },
                      { id: 'location', label: 'Location', type: 'text', placeholder: 'City, Country' },
                      { id: 'website', label: 'Website', type: 'url', placeholder: 'https://yoursite.com' },
                    ].map(({ id, label, type, placeholder }) => (
                      <div key={id}>
                        <p style={lbl}>{label}</p>
                        <input type={type} value={profileForm[id as keyof UserProfile]}
                          onChange={e => setProfileForm(p => ({ ...p, [id]: e.target.value }))}
                          placeholder={placeholder} style={inp} disabled={isSavingProfile} />
                      </div>
                    ))}
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <p style={lbl}>Bio</p>
                    <textarea value={profileForm.bio}
                      onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))}
                      placeholder="Tell us about yourself…" rows={3} disabled={isSavingProfile}
                      style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="submit"
                      className={btnClass('primary')}
                      style={btn('linear-gradient(135deg,#6366f1,#8b5cf6)', 'white', { padding: '8px 18px' })}
                      disabled={isSavingProfile}>
                      {isSavingProfile ? <span className="dot-loader"><span/><span/><span/></span> : 'Save changes'}
                    </button>
                    <button type="button"
                      className={btnClass('ghost')}
                      onClick={() => { setIsEditingProfile(false); setProfileForm(userProfile); setProfileError('') }}
                      style={btn('#f1f5f9', '#64748b', { padding: '8px 18px' })} disabled={isSavingProfile}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px', padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '20px', flexShrink: 0 }}>
                      {(userProfile.full_name || username)[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '16px', color: '#0f172a' }}>{userProfile.full_name || username}</p>
                      <p style={{ fontSize: '13px', color: '#94a3b8' }}>{userProfile.occupation || 'No occupation set'}</p>
                    </div>
                  </div>
                  <div className="profile-form-grid" style={{ display: 'grid', gap: '18px' }}>
                    {[
                      { label: 'Phone', value: userProfile.phone },
                      { label: 'Location', value: userProfile.location },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p style={lbl}>{label}</p>
                        <p style={{ fontSize: '14px', fontWeight: 500, color: value ? '#0f172a' : '#cbd5e1' }}>{value || 'Not set'}</p>
                      </div>
                    ))}
                    <div>
                      <p style={lbl}>Website</p>
                      {userProfile.website
                        ? <a href={userProfile.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: '14px', fontWeight: 500, color: '#6366f1', textDecoration: 'none' }}>Visit ↗</a>
                        : <p style={{ fontSize: '14px', fontWeight: 500, color: '#cbd5e1' }}>Not set</p>}
                    </div>
                  </div>
                  {userProfile.bio && (
                    <div style={{ marginTop: '20px', paddingTop: '18px', borderTop: '1px solid #f1f5f9' }}>
                      <p style={lbl}>Bio</p>
                      <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.7, marginTop: '5px' }}>{userProfile.bio}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile bottom nav — visible only on ≤640px */}
      <nav className="dash-bottom-nav">
        {(['expenses', 'profile'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={tab === t ? 'active' : ''}>
            <span style={{ fontSize: '18px' }}>{t === 'expenses' ? '💸' : '👤'}</span>
            <span style={{ textTransform: 'capitalize' }}>{t}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
