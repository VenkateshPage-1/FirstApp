'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000
const WARNING_BEFORE_MS = 60 * 1000
const CACHE_TTL_MS = 60 * 1000 // 1 minute cache per month/category
const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Other']
const PAYMENT_METHODS = ['PhonePe', 'GPay', 'Bank Transfer', 'Cash']
const PAYMENT_ICON: Record<string, string> = { PhonePe: '📲', GPay: '🔵', 'Bank Transfer': '🏦', Cash: '💵' }

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
interface Expense { id: string; amount: number; category: string; description: string; date: string; payment_method: string }
interface ExpenseForm { amount: string; category: string; description: string; date: string; payment_method: string }
interface EMI { id: string; name: string; amount: number; months_remaining: number }
interface UserProfile { full_name: string; bio: string; phone: string; location: string; website: string; occupation: string; monthly_income: number; savings_goal_pct: number; category_budgets: Record<string, number>; emis: EMI[]; is_premium: boolean; premium_until: string | null; telegram_chat_id?: string | null }
interface Loan { id: string; person_name: string; amount: number; given_date: string; return_date: string | null; status: 'pending' | 'returned'; notes: string | null }

declare global { interface Window { Razorpay: new (opts: object) => { open(): void } } }

const emptyForm: ExpenseForm = {
  amount: '', category: 'Food', description: '',
  date: new Date().toISOString().split('T')[0],
  payment_method: 'Cash',
}
const emptyProfile: UserProfile = {
  full_name: '', bio: '', phone: '', location: '', website: '', occupation: '',
  monthly_income: 0, savings_goal_pct: 20, category_budgets: {}, emis: [],
  is_premium: false, premium_until: null,
}
type Tab = 'expenses' | 'analytics' | 'loans' | 'profile'

// Financial categories classification
const NEEDS_CATS = ['Food', 'Bills', 'Health']
const WANTS_CATS = ['Transport', 'Shopping', 'Entertainment', 'Other']

// Simple in-memory cache — keyed by userId so different users never share entries
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
  const [allExpenses, setAllExpenses] = useState<Expense[]>([])
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

  // Payment state
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [selectedPlan] = useState<'quarterly'>('quarterly')
  const [telegramCode, setTelegramCode] = useState<string | null>(null)
  const [telegramBotUsername, setTelegramBotUsername] = useState('')
  const [telegramLoading, setTelegramLoading] = useState(false)
  const [telegramMsg, setTelegramMsg] = useState('')

  // Loans state
  const [loans, setLoans] = useState<Loan[]>([])
  const [loansLoading, setLoansLoading] = useState(false)
  const [loanForm, setLoanForm] = useState({ person_name: '', amount: '', given_date: new Date().toISOString().split('T')[0], return_date: '', notes: '' })
  const [showLoanForm, setShowLoanForm] = useState(false)
  const [loanError, setLoanError] = useState('')
  const [loanSuccess, setLoanSuccess] = useState('')
  const [savingLoan, setSavingLoan] = useState(false)
  const [showReturnedLoans, setShowReturnedLoans] = useState(false)

  // Premium analytics setup state
  const [analyticsSetupStep, setAnalyticsSetupStep] = useState(0) // 0=income, 1=savings, 2=emis, 3=budgets
  const [setupIncome, setSetupIncome] = useState('')
  const [setupSavingsPct, setSetupSavingsPct] = useState('20')
  const [setupBudgets, setSetupBudgets] = useState<Record<string, string>>({})
  const [setupEmis, setSetupEmis] = useState<EMI[]>([])
  const [isSavingAnalytics, setIsSavingAnalytics] = useState(false)
  const [isEditingAnalytics, setIsEditingAnalytics] = useState(false)
  const [analyticsSuccess, setAnalyticsSuccess] = useState('')

  const isLoggingOut = useRef(false)
  const handleLogout = useCallback(async () => {
    if (isLoggingOut.current) return
    isLoggingOut.current = true
    setSigningOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    onLogout()
  }, [onLogout])

  const loadRazorpayScript = (): Promise<boolean> => new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return }
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })

  const handlePayment = useCallback(async (plan: 'quarterly' | 'annual') => {
    setPaymentLoading(true)
    setPaymentError('')
    try {
      const loaded = await loadRazorpayScript()
      if (!loaded) { setPaymentError('Could not load payment gateway. Check your internet connection.'); setPaymentLoading(false); return }

      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (!res.ok) { setPaymentError(data.error || 'Failed to create order'); setPaymentLoading(false); return }

      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: 'TrackPenny',
        description: data.label,
        order_id: data.order_id,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          const verifyRes = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response),
          })
          const verifyData = await verifyRes.json()
          if (verifyRes.ok) {
            setUserProfile(p => ({ ...p, is_premium: true, premium_until: verifyData.premium_until }))
            setPaymentLoading(false)
          } else {
            setPaymentError(verifyData.error || 'Payment verification failed. Contact support.')
            setPaymentLoading(false)
          }
        },
        modal: { ondismiss: () => setPaymentLoading(false) },
        prefill: { name: userProfile.full_name || username },
        theme: { color: '#6366f1' },
      }
      new window.Razorpay(options).open()
    } catch {
      setPaymentError('Payment failed. Please try again.')
      setPaymentLoading(false)
    }
  }, [username, userProfile.full_name])

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

  // On mount, evict any cache entries from other users
  useEffect(() => {
    Object.keys(cache).forEach(k => { if (!k.startsWith(`${username}__`)) delete cache[k] })
  }, [username])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const cacheKey = `${username}__${filterMonth}__${filterCategory}`

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

  // Fetch unfiltered month expenses for analytics (ignores category filter)
  useEffect(() => {
    const fetchAllExpenses = async () => {
      try {
        const res = await fetch(`/api/expenses?month=${filterMonth}`)
        if (!res.ok) return
        const data = await res.json()
        setAllExpenses(data.expenses ?? [])
      } catch { /* silent */ }
    }
    fetchAllExpenses()
  }, [filterMonth])

  useEffect(() => {
    const fetchLoans = async () => {
      setLoansLoading(true)
      try {
        const res = await fetch('/api/loans')
        if (!res.ok) return
        const data = await res.json()
        setLoans(data.loans ?? [])
      } catch { /* silent */ } finally {
        setLoansLoading(false)
      }
    }
    fetchLoans()
  }, [])

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
      payment_method: form.payment_method,
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
    setForm({ amount: String(expense.amount), category: expense.category, description: expense.description, date: expense.date, payment_method: expense.payment_method ?? 'Cash' })
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
    <div className="fade-in" style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'var(--font-inter), sans-serif', overflowX: 'hidden', width: '100%' }}>

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
          <span style={{ fontWeight: 800, fontSize: '17px', letterSpacing: '-0.5px' }}>
            <span style={{ color: '#10b981' }}>Track</span><span style={{ color: '#6366f1' }}>Penny</span>
          </span>
          <div className="dash-nav-tabs" style={{ display: 'flex', gap: '2px' }}>
            {(['expenses', 'analytics', 'loans', 'profile'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)} className="btn-pill"
                style={{ padding: '5px 14px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '13px', fontFamily: 'inherit', background: tab === t ? '#eef2ff' : 'transparent', color: tab === t ? '#6366f1' : '#64748b', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '5px' }}>
                {t === 'analytics' ? 'Analytics' : t === 'loans' ? 'Lent' : t}
              </button>
            ))}
          </div>
        </div>
        <div ref={userMenuRef} style={{ position: 'relative', flexShrink: 0 }}>
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

      <div className="dash-content dash-scroll-area" style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>

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
                      <p style={lbl}>Month &amp; Year</p>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <select value={filterMonthNum} onChange={e => setFilterMonthNum(Number(e.target.value))} style={{ ...inp, flex: '0 0 90px', minWidth: 0 }}>
                          {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                            <option key={i} value={i + 1}>{m}</option>
                          ))}
                        </select>
                        <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} style={{ ...inp, flex: 1, minWidth: 0 }}>
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
                        <div>
                          <p style={lbl}>Payment via</p>
                          <select value={form.payment_method} onChange={e => setForm(p => ({ ...p, payment_method: e.target.value }))} style={inp}>
                            {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                          </select>
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
                                  <p style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '1px' }}>
                                    {PAYMENT_ICON[expense.payment_method] ?? '💵'} {expense.payment_method ?? 'Cash'}
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

        {/* ── ANALYTICS TAB ── */}
        {tab === 'analytics' && (() => {
          // Premium gate
          const isPremium = userProfile.is_premium && !!userProfile.premium_until && new Date(userProfile.premium_until) > new Date()
          if (!isPremium) {
            return (
              <div style={{ maxWidth: '420px', margin: '0 auto', padding: '8px 0' }}>

                {/* Dark hero card */}
                <div style={{ background: 'linear-gradient(145deg,#0f172a 0%,#1e1b4b 100%)', borderRadius: '20px', padding: '36px 28px 28px', textAlign: 'center', marginBottom: '16px', border: '1px solid rgba(139,92,246,0.25)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)', width: '200px', height: '200px', background: 'radial-gradient(circle,rgba(139,92,246,0.3) 0%,transparent 70%)', pointerEvents: 'none' }} />
                  <div style={{ fontSize: '36px', marginBottom: '14px', position: 'relative' }}>✨</div>
                  <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#f1f5f9', marginBottom: '16px', letterSpacing: '-0.5px', position: 'relative' }}>TrackPenny Premium</h2>
                  <div style={{ margin: '0 0 6px', position: 'relative' }}>
                    <span style={{ fontSize: '52px', fontWeight: 900, color: '#fff', letterSpacing: '-2px' }}>₹49</span>
                    <span style={{ fontSize: '15px', color: '#94a3b8', marginLeft: '6px' }}>one time</span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px', position: 'relative' }}>Pay once · Unlock forever · No hidden fees</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', position: 'relative' }}>
                    {['Health Score', '50/30/20', 'Budget Drums', 'Forecast', 'EMI Tracker'].map(f => (
                      <span key={f} style={{ fontSize: '11px', fontWeight: 600, color: '#a78bfa', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)', padding: '4px 10px', borderRadius: '20px' }}>{f}</span>
                    ))}
                  </div>
                </div>

                {/* Features list */}
                <div style={{ background: '#fafafa', borderRadius: '14px', border: '1px solid #f1f5f9', padding: '18px 20px', marginBottom: '14px' }}>
                  {[
                    'Financial Health Score (0–100)',
                    '50/30/20 Rule tracker',
                    'EMI-aware savings calculations',
                    'Budget vs actual glass drums',
                    'Month-end spending forecast',
                    'Payment method breakdown',
                    'Personalised money action plan',
                  ].map(text => (
                    <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7c3aed', flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', color: '#334155', fontWeight: 500 }}>{text}</span>
                    </div>
                  ))}
                </div>

                {paymentError && <div className="alert-error" style={{ marginBottom: '12px' }}>{paymentError}</div>}

                <button
                  onClick={() => handlePayment(selectedPlan)}
                  disabled={paymentLoading}
                  style={{ width: '100%', background: paymentLoading ? '#a5b4fc' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', border: 'none', borderRadius: '14px', padding: '17px', fontSize: '15px', fontWeight: 800, cursor: paymentLoading ? 'not-allowed' : 'pointer', letterSpacing: '0.01em', boxShadow: paymentLoading ? 'none' : '0 4px 20px rgba(99,102,241,0.35)', transition: 'all 0.15s' }}
                >
                  {paymentLoading
                    ? <span className="dot-loader"><span/><span/><span/></span>
                    : 'Unlock Premium — ₹49'}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '12px' }}>
                  {['🔒 Razorpay secured', '💳 UPI · Cards · Net Banking'].map(t => (
                    <span key={t} style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500 }}>{t}</span>
                  ))}
                </div>
              </div>
            )
          }

          const income = userProfile.monthly_income ?? 0
          const savingsGoal = userProfile.savings_goal_pct ?? 20
          const catBudgets = userProfile.category_budgets ?? {}
          const emis = userProfile.emis ?? []
          const totalEMI = emis.reduce((s, e) => s + e.amount, 0)
          const disposableIncome = Math.max(0, income - totalEMI)
          const isSetup = income > 0

          // EMI-aware calculations — use allExpenses (unfiltered by category) for accuracy
          const totalThisMonth = allExpenses.reduce((s, e) => s + e.amount, 0)
          const savings = Math.max(0, income - totalThisMonth - totalEMI)
          const savingsRate = income > 0 ? (savings / income) * 100 : 0
          const needsTotal = allExpenses.filter(e => NEEDS_CATS.includes(e.category)).reduce((s, e) => s + e.amount, 0)
          const wantsTotal = allExpenses.filter(e => WANTS_CATS.includes(e.category)).reduce((s, e) => s + e.amount, 0)
          const needsPct = disposableIncome > 0 ? (needsTotal / disposableIncome) * 100 : 0
          const wantsPct = disposableIncome > 0 ? (wantsTotal / disposableIncome) * 100 : 0
          const savingsPct = income > 0 ? (savings / income) * 100 : 0
          const emiPct = income > 0 ? (totalEMI / income) * 100 : 0

          // Month-end forecast
          const daysInMonth = new Date(filterYear, filterMonthNum, 0).getDate()
          const dayOfMonth = filterMonth === new Date().toISOString().slice(0,7)
            ? new Date().getDate() : daysInMonth
          const dailyRate = dayOfMonth > 0 ? totalThisMonth / dayOfMonth : 0
          const forecastVariable = dailyRate * daysInMonth
          const forecastTotal = forecastVariable + totalEMI

          // Payment split
          const paymentTotals = PAYMENT_METHODS.reduce<Record<string,number>>((acc, m) => {
            acc[m] = allExpenses.filter(e => (e.payment_method ?? 'Cash') === m).reduce((s,e) => s + e.amount, 0)
            return acc
          }, {})

          // Financial health score (0-100)
          const savingsScore = Math.min(35, (savingsRate / savingsGoal) * 35)
          const budgetCats = CATEGORIES.filter(c => catBudgets[c] > 0)
          const budgetScore = budgetCats.length > 0
            ? (budgetCats.filter(c => {
                const spent = allExpenses.filter(e => e.category === c).reduce((s,e) => s+e.amount,0)
                return spent <= catBudgets[c]
              }).length / budgetCats.length) * 35 : 17
          const consistencyScore = Math.min(15, (allExpenses.length / 10) * 15)
          const emiHealthScore = emiPct <= 30 ? 15 : emiPct <= 40 ? 8 : 0
          const healthScore = Math.round(savingsScore + budgetScore + consistencyScore + emiHealthScore)
          const scoreColor = healthScore >= 70 ? '#10b981' : healthScore >= 40 ? '#f59e0b' : '#ef4444'
          const scoreLabel = healthScore >= 70 ? 'Excellent' : healthScore >= 40 ? 'Fair' : 'Needs Work'

          const saveAnalytics = async (income: number, savPct: number, budgets: Record<string,number>, emisList: EMI[]) => {
            setIsSavingAnalytics(true)
            await fetch('/api/profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...userProfile, monthly_income: income, savings_goal_pct: savPct, category_budgets: budgets, emis: emisList }),
            })
            setUserProfile(p => ({ ...p, monthly_income: income, savings_goal_pct: savPct, category_budgets: budgets, emis: emisList }))
            setIsSavingAnalytics(false)
            setIsEditingAnalytics(false)
            setAnalyticsSuccess('Saved!')
            setTimeout(() => setAnalyticsSuccess(''), 2500)
          }

          const handleSaveAnalyticsSetup = async () => {
            const budgets: Record<string,number> = {}
            CATEGORIES.forEach(c => { if (setupBudgets[c]) budgets[c] = Number(setupBudgets[c]) })
            await saveAnalytics(Number(setupIncome), Number(setupSavingsPct), budgets, setupEmis)
          }

          const handleSaveAnalyticsEdit = async () => {
            await saveAnalytics(
              Number(setupIncome) || income,
              Number(setupSavingsPct) || savingsGoal,
              Object.fromEntries(CATEGORIES.filter(c => setupBudgets[c]).map(c => [c, Number(setupBudgets[c])])),
              setupEmis
            )
          }

          const startEditing = () => {
            setSetupIncome(String(income))
            setSetupSavingsPct(String(savingsGoal))
            setSetupBudgets(Object.fromEntries(Object.entries(catBudgets).map(([k,v])=>[k,String(v)])))
            setSetupEmis(emis.map(e => ({ ...e })))
            setIsEditingAnalytics(true)
          }

          if (!isSetup) {
            // ── SETUP FLOW ──
            return (
              <div style={{ maxWidth: '560px', margin: '0 auto' }}>
                {/* Hero */}
                <div style={{ ...card({ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', textAlign: 'center', padding: '32px 28px' }) }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>📊</div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>Unlock Premium Analytics</h2>
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>
                    Answer 4 quick questions to get your Financial Health Score, EMI impact, 50/30/20 tracker, savings forecast, and budget alerts.
                  </p>
                </div>

                {/* Step indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {['Income', 'Savings', 'EMIs', 'Budgets'].map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: analyticsSetupStep >= i ? '#6366f1' : '#e2e8f0', color: analyticsSetupStep >= i ? 'white' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
                        {analyticsSetupStep > i ? '✓' : i + 1}
                      </div>
                      <span style={{ fontSize: '12px', color: analyticsSetupStep >= i ? '#6366f1' : '#94a3b8', fontWeight: analyticsSetupStep >= i ? 600 : 400 }}>{s}</span>
                      {i < 3 && <div style={{ width: '16px', height: '2px', background: analyticsSetupStep > i ? '#6366f1' : '#e2e8f0', borderRadius: '1px' }} />}
                    </div>
                  ))}
                </div>

                {/* Step 0: Income */}
                {analyticsSetupStep === 0 && (
                  <div className="fade-in" style={card()}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>💰 Monthly take-home income?</h3>
                    <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>After tax. This is the foundation of every financial ratio — savings rate, budget allocation, everything.</p>
                    <p style={lbl}>Monthly Income (₹)</p>
                    <input type="number" value={setupIncome} onChange={e => setSetupIncome(e.target.value)} placeholder="e.g. 50000" style={{ ...inp, marginBottom: '20px' }} autoFocus />
                    <button onClick={() => setupIncome && setAnalyticsSetupStep(1)}
                      style={{ width: '100%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: setupIncome ? 1 : 0.5 }}>
                      Continue →
                    </button>
                  </div>
                )}

                {/* Step 1: Savings goal */}
                {analyticsSetupStep === 1 && (
                  <div className="fade-in" style={card()}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>🎯 What % do you want to save?</h3>
                    <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Experts recommend at least <strong>20%</strong>. Warren Buffett saves 50%+. Start with what's realistic.</p>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                      {['10', '20', '30', '40', '50'].map(p => (
                        <button key={p} onClick={() => setSetupSavingsPct(p)}
                          style={{ padding: '8px 16px', borderRadius: '8px', border: `2px solid ${setupSavingsPct === p ? '#6366f1' : '#e2e8f0'}`, background: setupSavingsPct === p ? '#eef2ff' : 'white', color: setupSavingsPct === p ? '#6366f1' : '#475569', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
                          {p}%
                        </button>
                      ))}
                    </div>
                    <p style={lbl}>Custom %</p>
                    <input type="number" min="1" max="100" value={setupSavingsPct} onChange={e => setSetupSavingsPct(e.target.value)} style={{ ...inp, marginBottom: '12px' }} />
                    <p style={{ fontSize: '12px', color: '#10b981', marginBottom: '16px', fontWeight: 500 }}>
                      💡 Saving {setupSavingsPct}% = ₹{Math.round(Number(setupIncome) * Number(setupSavingsPct) / 100).toLocaleString('en-IN')}/month
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => setAnalyticsSetupStep(0)} style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
                      <button onClick={() => setAnalyticsSetupStep(2)} style={{ flex: 2, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Continue →</button>
                    </div>
                  </div>
                )}

                {/* Step 2: EMIs */}
                {analyticsSetupStep === 2 && (
                  <div className="fade-in" style={card()}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>🏦 Any monthly EMIs?</h3>
                    <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>Home loan, car loan, personal loan etc. EMIs are fixed liabilities — analytics will use your <strong>disposable income</strong> (salary − EMIs) for all ratios.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                      {setupEmis.map((emi, i) => (
                        <div key={emi.id} style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '10px 12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                          <div style={{ flex: 1 }}>
                            <input value={emi.name} onChange={e => setSetupEmis(prev => prev.map((x,j) => j===i ? {...x, name: e.target.value} : x))}
                              placeholder="e.g. Home Loan" style={{ ...inp, marginBottom: '6px', fontSize: '13px' }} />
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <input type="number" value={emi.amount || ''} onChange={e => setSetupEmis(prev => prev.map((x,j) => j===i ? {...x, amount: Number(e.target.value)} : x))}
                                placeholder="₹ EMI amount" style={{ ...inp, flex: 1, fontSize: '13px' }} />
                              <input type="number" value={emi.months_remaining || ''} onChange={e => setSetupEmis(prev => prev.map((x,j) => j===i ? {...x, months_remaining: Number(e.target.value)} : x))}
                                placeholder="Months left" style={{ ...inp, flex: 1, fontSize: '13px' }} />
                            </div>
                          </div>
                          <button onClick={() => setSetupEmis(prev => prev.filter((_,j) => j!==i))}
                            style={{ background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px', flexShrink: 0 }}>✕</button>
                        </div>
                      ))}
                      <button onClick={() => setSetupEmis(prev => [...prev, { id: Date.now().toString(), name: '', amount: 0, months_remaining: 0 }])}
                        style={{ background: '#eef2ff', color: '#6366f1', border: '1.5px dashed #c7d2fe', borderRadius: '10px', padding: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                        + Add EMI
                      </button>
                    </div>
                    {setupEmis.length > 0 && (
                      <div style={{ padding: '10px 12px', background: '#f0fdf4', borderRadius: '8px', marginBottom: '16px' }}>
                        <p style={{ fontSize: '12px', color: '#065f46', fontWeight: 500 }}>
                          Total EMI: ₹{setupEmis.reduce((s,e) => s+e.amount,0).toLocaleString('en-IN')}/month ·
                          Disposable income: ₹{Math.max(0, Number(setupIncome) - setupEmis.reduce((s,e)=>s+e.amount,0)).toLocaleString('en-IN')}
                        </p>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => setAnalyticsSetupStep(1)} style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
                      <button onClick={() => setAnalyticsSetupStep(3)} style={{ flex: 2, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Continue →</button>
                    </div>
                  </div>
                )}

                {/* Step 3: Category budgets */}
                {analyticsSetupStep === 3 && (
                  <div className="fade-in" style={card()}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>📦 Monthly budget per category</h3>
                    <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>Enables budget vs actual alerts. Skip any you don't want to track.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                      {CATEGORIES.map(cat => (
                        <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '18px', width: '24px', textAlign: 'center' }}>{CAT_ICON[cat]}</span>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155', width: '110px' }}>{cat}</span>
                          <input type="number" min="0" value={setupBudgets[cat] ?? ''} onChange={e => setSetupBudgets(p => ({ ...p, [cat]: e.target.value }))}
                            placeholder="₹ limit" style={{ ...inp, flex: 1 }} />
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => setAnalyticsSetupStep(2)} style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
                      <button onClick={handleSaveAnalyticsSetup} disabled={isSavingAnalytics}
                        style={{ flex: 2, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                        {isSavingAnalytics ? <span className="dot-loader"><span/><span/><span/></span> : '🚀 Unlock Analytics'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          }

          // ── ANALYTICS DASHBOARD ──
          const allByCategory = CATEGORIES.map(cat => ({
            cat,
            total: allExpenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0),
          })).filter(x => x.total > 0).sort((a, b) => b.total - a.total)
          const fmt = (n: number) => n >= 100000 ? `₹${(n/100000).toFixed(1)}L` : n >= 1000 ? `₹${(n/1000).toFixed(1)}K` : `₹${Math.round(n)}`
          const daysPct = Math.round((dayOfMonth / daysInMonth) * 100)
          return (
            <div>
              {/* ── HEADER ── */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: '0 0 3px', letterSpacing: '-0.3px' }}>Premium Analytics</h2>
                  <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {new Date(filterYear, filterMonthNum - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} · {allExpenses.length} transactions
                  </p>
                </div>
                <button onClick={startEditing} style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '7px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  ✏️ Edit Settings
                </button>
              </div>
              {analyticsSuccess && <div className="alert-success fade-in" style={{ marginBottom: '14px' }}>{analyticsSuccess}</div>}

              {/* ── SUMMARY STRIP ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: '10px', marginBottom: '16px' }}>
                {[
                  { label: 'Income', value: fmt(income), sub: 'monthly', color: '#6366f1', bg: '#eef2ff' },
                  { label: 'Spent', value: fmt(totalThisMonth), sub: `${dayOfMonth} days`, color: '#ef4444', bg: '#fef2f2' },
                  { label: 'Saved', value: fmt(savings), sub: `${savingsRate.toFixed(0)}% rate`, color: '#10b981', bg: '#f0fdf4' },
                  { label: 'EMI', value: fmt(totalEMI), sub: `${emiPct.toFixed(0)}% of income`, color: '#f59e0b', bg: '#fffbeb' },
                ].map(({ label, value, sub, color, bg }) => (
                  <div key={label} style={{ background: bg, borderRadius: '12px', padding: '14px 16px', border: `1px solid ${color}22` }}>
                    <p style={{ fontSize: '11px', color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{label}</p>
                    <p style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: '2px' }}>{value}</p>
                    <p style={{ fontSize: '11px', color: '#94a3b8' }}>{sub}</p>
                  </div>
                ))}
              </div>

              {/* ── EDIT SETTINGS PANEL ── */}
              {isEditingAnalytics && (
                <div className="fade-in" style={{ ...card({ border: '2px solid #6366f1', padding: '20px 24px' }), marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>Update Settings</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                    <div><p style={lbl}>Monthly Income (₹)</p><input type="number" value={setupIncome} onChange={e => setSetupIncome(e.target.value)} style={inp} /></div>
                    <div><p style={lbl}>Savings Goal (%)</p><input type="number" min="1" max="100" value={setupSavingsPct} onChange={e => setSetupSavingsPct(e.target.value)} style={inp} /></div>
                  </div>
                  <p style={{ ...lbl, marginBottom: '10px' }}>EMIs</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                    {setupEmis.map((emi, i) => (
                      <div key={emi.id} style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '10px 12px', background: '#f8fafc', borderRadius: '10px' }}>
                        <div style={{ flex: 1 }}>
                          <input value={emi.name} onChange={e => setSetupEmis(prev => prev.map((x,j) => j===i ? {...x, name: e.target.value} : x))} placeholder="Loan name" style={{ ...inp, marginBottom: '6px', fontSize: '13px' }} />
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <input type="number" value={emi.amount || ''} onChange={e => setSetupEmis(prev => prev.map((x,j) => j===i ? {...x, amount: Number(e.target.value)} : x))} placeholder="₹ EMI" style={{ ...inp, flex: 1, fontSize: '13px' }} />
                            <input type="number" value={emi.months_remaining || ''} onChange={e => setSetupEmis(prev => prev.map((x,j) => j===i ? {...x, months_remaining: Number(e.target.value)} : x))} placeholder="Months left" style={{ ...inp, flex: 1, fontSize: '13px' }} />
                          </div>
                        </div>
                        <button onClick={() => setSetupEmis(prev => prev.filter((_,j) => j!==i))} style={{ background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>✕</button>
                      </div>
                    ))}
                    <button onClick={() => setSetupEmis(prev => [...prev, { id: Date.now().toString(), name: '', amount: 0, months_remaining: 0 }])} style={{ background: '#eef2ff', color: '#6366f1', border: '1.5px dashed #c7d2fe', borderRadius: '10px', padding: '9px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>+ Add EMI</button>
                  </div>
                  <p style={{ ...lbl, marginBottom: '10px' }}>Category Budgets (₹/month)</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                    {CATEGORIES.map(cat => (
                      <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px' }}>{CAT_ICON[cat]}</span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155', width: '72px', flexShrink: 0 }}>{cat}</span>
                        <input type="number" min="0" value={setupBudgets[cat] ?? ''} onChange={e => setSetupBudgets(p => ({ ...p, [cat]: e.target.value }))} placeholder="₹ limit" style={{ ...inp, flex: 1 }} />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setIsEditingAnalytics(false)} style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '10px', padding: '11px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                    <button onClick={handleSaveAnalyticsEdit} disabled={isSavingAnalytics} style={{ flex: 2, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', border: 'none', borderRadius: '10px', padding: '11px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {isSavingAnalytics ? <span className="dot-loader"><span/><span/><span/></span> : '💾 Save & Re-run'}
                    </button>
                  </div>
                </div>
              )}

              <div className="dash-grid">
                {/* ── LEFT COLUMN ── */}
                <div>

                  {/* Overall Score */}
                  <div style={card({ padding: '24px' })}>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>Overall Financial Health</p>
                    <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', lineHeight: 1.5 }}>
                      We score your money habits out of 100 based on how much you save, how well you stick to your budget, and how much of your income goes to loan payments.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <svg viewBox="0 0 80 80" width="80" height="80" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
                        <circle cx="40" cy="40" r="32" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                        <circle cx="40" cy="40" r="32" fill="none" stroke={scoreColor} strokeWidth="8"
                          strokeDasharray={`${(healthScore / 100) * 201} 201`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease' }} />
                      </svg>
                      <div>
                        <p style={{ fontSize: '40px', fontWeight: 900, color: scoreColor, letterSpacing: '-2px', lineHeight: 1 }}>{healthScore}</p>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: scoreColor, marginTop: '2px' }}>{scoreLabel}</p>
                        <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>out of 100</p>
                      </div>
                    </div>
                    <div style={{ marginTop: '16px', padding: '12px 14px', borderRadius: '10px', background: healthScore >= 70 ? '#f0fdf4' : healthScore >= 40 ? '#fffbeb' : '#fef2f2' }}>
                      <p style={{ fontSize: '13px', color: healthScore >= 70 ? '#065f46' : healthScore >= 40 ? '#92400e' : '#b91c1c', lineHeight: 1.6 }}>
                        {healthScore >= 70
                          ? '🎉 Your finances are in great shape! You\'re saving well and spending responsibly.'
                          : healthScore >= 40
                          ? '📈 You\'re doing okay, but there\'s room to improve. Focus on saving more each month.'
                          : '⚠️ Your finances need attention. Try to cut unnecessary spending and save at least 10% of income.'}
                      </p>
                    </div>
                  </div>

                  {/* How much are you saving */}
                  <div style={card({ padding: '20px 24px' })}>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>How much are you saving?</p>
                    <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', lineHeight: 1.5 }}>
                      Out of every ₹100 you earn, you are saving <strong style={{ color: savingsRate >= savingsGoal ? '#10b981' : '#ef4444' }}>₹{savingsRate.toFixed(0)}</strong>. Your goal is ₹{savingsGoal}.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div>
                        <p style={{ fontSize: '28px', fontWeight: 900, color: savingsRate >= savingsGoal ? '#10b981' : '#ef4444', letterSpacing: '-1px', lineHeight: 1 }}>{fmt(savings)}</p>
                        <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '3px' }}>saved this month</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: savingsRate >= savingsGoal ? '#10b981' : '#f59e0b' }}>{savingsRate.toFixed(1)}%</p>
                        <p style={{ fontSize: '11px', color: '#94a3b8' }}>target: {savingsGoal}%</p>
                      </div>
                    </div>
                    <div style={{ position: 'relative', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                      <div style={{ height: '100%', width: `${Math.min(savingsRate, 100)}%`, background: savingsRate >= savingsGoal ? '#10b981' : '#f59e0b', borderRadius: '4px', transition: 'width 0.8s ease' }} />
                      <div style={{ position: 'absolute', top: 0, left: `${Math.min(savingsGoal, 98)}%`, width: '2px', height: '100%', background: '#6366f1' }} />
                    </div>
                    <p style={{ fontSize: '12px', color: savingsRate >= savingsGoal ? '#10b981' : '#64748b' }}>
                      {savingsRate >= savingsGoal
                        ? `✅ You're ₹${(savingsRate - savingsGoal).toFixed(0)} ahead of your goal — well done!`
                        : `You need to save ${fmt((savingsGoal / 100) * income - savings)} more to reach your ${savingsGoal}% goal.`}
                    </p>
                  </div>

                  {/* Will you overspend — moved to left */}
                  <div style={card({ padding: '20px 24px' })}>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>Will you overspend this month?</p>
                    <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px', lineHeight: 1.5 }}>
                      Based on your spending so far ({dayOfMonth} of {daysInMonth} days), you are on track to spend:
                    </p>
                    <p style={{ fontSize: '32px', fontWeight: 900, color: forecastTotal > income ? '#ef4444' : '#0f172a', letterSpacing: '-1.5px', marginBottom: '4px' }}>{fmt(forecastTotal)}</p>
                    <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '14px' }}>
                      Daily average: {fmt(dailyRate)}/day · Loan payments: {fmt(totalEMI)}/month
                    </p>
                    <div style={{ position: 'relative', height: '8px', background: '#f1f5f9', borderRadius: '4px', marginBottom: '8px', overflow: 'visible' }}>
                      <div style={{ height: '100%', width: `${daysPct}%`, background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', borderRadius: '4px', transition: 'width 0.8s ease' }} />
                      <div style={{ position: 'absolute', top: '-4px', left: `${daysPct}%`, width: '14px', height: '14px', borderRadius: '50%', background: '#6366f1', border: '2px solid white', boxShadow: '0 1px 4px rgba(99,102,241,0.4)', transform: 'translateX(-50%)' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginBottom: '14px' }}>
                      <span>Start of month</span><span>Today (day {dayOfMonth})</span><span>End</span>
                    </div>
                    {income > 0 && (
                      <div style={{ padding: '12px 14px', borderRadius: '10px', background: forecastTotal > income ? '#fef2f2' : '#f0fdf4' }}>
                        <p style={{ fontSize: '13px', color: forecastTotal > income ? '#b91c1c' : '#065f46', fontWeight: 600, lineHeight: 1.6 }}>
                          {forecastTotal > income
                            ? `⚠️ You may overspend by ${fmt(forecastTotal - income)}. Try to spend ${fmt(dailyRate * (daysInMonth - dayOfMonth) - (income - totalThisMonth - totalEMI))} less in the remaining ${daysInMonth - dayOfMonth} days.`
                            : `✅ You're on track to save ${fmt(income - forecastTotal)} by end of month. Keep it up!`}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Spending limits — glass drum — moved to left for more width */}
                  {Object.keys(catBudgets).length > 0 && (
                    <div style={{ ...card({ padding: '24px 28px' }), background: 'linear-gradient(145deg, #0f172a 0%, #1e1b4b 100%)', border: '1px solid rgba(139,92,246,0.18)' }}>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9', marginBottom: '4px' }}>Budget vs Actual Spending</p>
                      <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '22px', lineHeight: 1.5 }}>
                        Each tube shows how full your budget is this month
                      </p>
                      {CATEGORIES.filter(c => catBudgets[c] > 0).map(cat => {
                        const spent = allExpenses.filter(e => e.category === cat).reduce((s,e) => s + e.amount, 0)
                        const budget = catBudgets[cat]
                        const pct = Math.min((spent / budget) * 100, 100)
                        const rawPct = (spent / budget) * 100
                        const over = rawPct > 100
                        const warn = rawPct > 80 && !over
                        // liquid gradient colour
                        const liquidGrad = over
                          ? 'linear-gradient(90deg, #b91c1c 0%, #ef4444 60%, #fca5a5 100%)'
                          : warn
                          ? 'linear-gradient(90deg, #b45309 0%, #f59e0b 60%, #fde68a 100%)'
                          : 'linear-gradient(90deg, #065f46 0%, #10b981 60%, #6ee7b7 100%)'
                        const glowColor = over ? '#ef444455' : warn ? '#f59e0b55' : '#10b98155'
                        const labelColor = over ? '#fca5a5' : warn ? '#fde68a' : '#6ee7b7'
                        return (
                          <div key={cat} style={{ marginBottom: '18px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>{CAT_ICON[cat]} {cat}</span>
                              <span style={{ fontSize: '12px', fontWeight: 700, color: labelColor }}>
                                {fmt(spent)} / {fmt(budget)}
                                {over && <span style={{ marginLeft: '6px', fontSize: '11px', background: '#7f1d1d', color: '#fca5a5', padding: '1px 7px', borderRadius: '20px' }}>+{fmt(spent - budget)} over</span>}
                              </span>
                            </div>
                            {/* Glass drum track */}
                            <div style={{
                              position: 'relative',
                              height: '22px',
                              borderRadius: '100px',
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px solid rgba(255,255,255,0.10)',
                              overflow: 'hidden',
                              boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.4)',
                            }}>
                              {/* Liquid fill */}
                              <div style={{
                                position: 'absolute',
                                top: 0, left: 0,
                                height: '100%',
                                width: `${pct}%`,
                                background: liquidGrad,
                                borderRadius: '100px',
                                transition: 'width 1s cubic-bezier(0.34,1.56,0.64,1)',
                                boxShadow: `0 0 12px ${glowColor}`,
                              }} />
                              {/* Glass shine overlay */}
                              <div style={{
                                position: 'absolute',
                                top: '2px', left: '4px', right: '4px',
                                height: '7px',
                                borderRadius: '100px',
                                background: 'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 100%)',
                                pointerEvents: 'none',
                              }} />
                              {/* Percentage text inside */}
                              {pct > 18 && (
                                <span style={{
                                  position: 'absolute',
                                  left: '10px',
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  color: 'rgba(255,255,255,0.9)',
                                  letterSpacing: '0.02em',
                                  textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                                }}>
                                  {rawPct.toFixed(0)}%
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize: '11px', color: '#64748b', marginTop: '5px' }}>
                              {over
                                ? `Exceeded by ${fmt(spent - budget)} — review this category`
                                : warn
                                ? `Only ${fmt(budget - spent)} left — almost full`
                                : `${fmt(budget - spent)} remaining out of ${fmt(budget)}`}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  )}

                </div>

                {/* ── RIGHT COLUMN ── */}
                <div>

                  {/* Where is your money going */}
                  <div style={card({ padding: '20px 24px' })}>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>Where is your money going?</p>
                    <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px', lineHeight: 1.5 }}>
                      The ideal split is: <strong>50%</strong> on essentials, <strong>30%</strong> on lifestyle, <strong>20%</strong> on savings.
                    </p>
                    <div style={{ display: 'flex', height: '12px', borderRadius: '6px', overflow: 'hidden', marginBottom: '14px', gap: '2px' }}>
                      <div style={{ flex: needsPct, background: '#6366f1', minWidth: needsPct > 0 ? '4px' : 0, transition: 'flex 0.8s ease', borderRadius: '6px 0 0 6px' }} />
                      <div style={{ flex: wantsPct, background: '#8b5cf6', minWidth: wantsPct > 0 ? '4px' : 0, transition: 'flex 0.8s ease' }} />
                      <div style={{ flex: Math.max(savingsPct, 0), background: '#10b981', minWidth: savingsPct > 0 ? '4px' : 0, transition: 'flex 0.8s ease', borderRadius: '0 6px 6px 0' }} />
                    </div>
                    {[
                      { label: 'Essentials', desc: 'Food, Bills, Health', actual: needsPct, target: 50, amount: needsTotal, color: '#6366f1', tip: needsPct > 55 ? 'Too high — try cutting food or utility bills' : needsPct <= 50 ? 'Within the ideal limit' : 'Slightly above, keep an eye on it' },
                      { label: 'Lifestyle', desc: 'Shopping, Entertainment, Transport', actual: wantsPct, target: 30, amount: wantsTotal, color: '#8b5cf6', tip: wantsPct > 35 ? 'Reduce shopping or outings to save more' : 'Good — lifestyle spending is in control' },
                      { label: 'Savings', desc: 'Money you kept this month', actual: savingsPct, target: 20, amount: savings, color: '#10b981', tip: savingsPct >= 20 ? 'Great! You hit the 20% savings target' : 'Aim for at least 20% — small cuts add up' },
                    ].map(({ label, desc, actual, target, amount, color, tip }) => (
                      <div key={label} style={{ padding: '10px 12px', borderRadius: '10px', background: '#f8fafc', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, flexShrink: 0, marginTop: '2px' }} />
                            <div>
                              <p style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>{label}</p>
                              <p style={{ fontSize: '11px', color: '#94a3b8' }}>{desc}</p>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '14px', fontWeight: 800, color: actual > target + 5 ? '#ef4444' : color }}>{actual.toFixed(0)}%</p>
                            <p style={{ fontSize: '10px', color: '#94a3b8' }}>ideal: {target}%</p>
                          </div>
                        </div>
                        <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', paddingLeft: '18px' }}>{fmt(amount)} · {tip}</p>
                      </div>
                    ))}
                  </div>

                  {/* Loan payments */}
                  {emis.length > 0 && (
                    <div style={card({ padding: '20px 24px' })}>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>Your monthly loan payments</p>
                      <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px', lineHeight: 1.5 }}>
                        You pay <strong>{fmt(totalEMI)}</strong> every month on loans — that is <strong style={{ color: emiPct > 40 ? '#ef4444' : emiPct > 30 ? '#f59e0b' : '#10b981' }}>{emiPct.toFixed(0)}%</strong> of your income.
                      </p>
                      <div style={{ padding: '10px 14px', borderRadius: '10px', marginBottom: '14px', background: emiPct > 40 ? '#fef2f2' : emiPct > 30 ? '#fffbeb' : '#f0fdf4' }}>
                        <p style={{ fontSize: '13px', color: emiPct > 40 ? '#b91c1c' : emiPct > 30 ? '#92400e' : '#065f46', fontWeight: 600 }}>
                          {emiPct > 40
                            ? '⚠️ More than 40% of your income goes to loans. This is high — consider paying off one loan early to free up cash.'
                            : emiPct > 30
                            ? '🟡 Around 30–40% on loans is manageable, but try not to take any new loans right now.'
                            : '✅ Less than 30% on loans — this is healthy. You have good room to manage your expenses.'}
                        </p>
                      </div>
                      {emis.map(emi => {
                        const debtFreeDate = new Date()
                        debtFreeDate.setMonth(debtFreeDate.getMonth() + emi.months_remaining)
                        const yrs = Math.floor(emi.months_remaining / 12)
                        const mos = emi.months_remaining % 12
                        const timeLeft = yrs > 0 ? `${yrs} yr${yrs > 1 ? 's' : ''} ${mos > 0 ? `${mos} mo` : ''}` : `${mos} months`
                        return (
                          <div key={emi.id} style={{ marginBottom: '10px', padding: '12px 14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <p style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>🏦 {emi.name}</p>
                                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>{timeLeft} remaining · loan ends {debtFreeDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</p>
                              </div>
                              <p style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>{fmt(emi.amount)}<span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 400 }}>/mo</span></p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* How you pay */}
                  <div style={card({ padding: '20px 24px' })}>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>How are you paying?</p>
                    <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px', lineHeight: 1.5 }}>
                      {PAYMENT_METHODS.filter(m => paymentTotals[m] > 0).length === 0
                        ? 'No expenses recorded this month yet.'
                        : `You used ${PAYMENT_METHODS.filter(m => paymentTotals[m] > 0).length} payment method${PAYMENT_METHODS.filter(m => paymentTotals[m] > 0).length > 1 ? 's' : ''} this month.`}
                    </p>
                    {PAYMENT_METHODS.filter(m => paymentTotals[m] > 0).map(m => {
                      const pct = totalThisMonth > 0 ? (paymentTotals[m] / totalThisMonth) * 100 : 0
                      return (
                        <div key={m} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                          <span style={{ fontSize: '20px', width: '28px', textAlign: 'center', flexShrink: 0 }}>{PAYMENT_ICON[m]}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>{m}</span>
                              <span style={{ fontSize: '12px', color: '#64748b' }}>{fmt(paymentTotals[m])} ({pct.toFixed(0)}%)</span>
                            </div>
                            <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: '#6366f1', borderRadius: '3px', transition: 'width 0.8s ease' }} />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* What should you do next */}
                  <div style={{ background: '#0f172a', borderRadius: '16px', padding: '20px 24px', border: '1px solid #1e293b' }}>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9', marginBottom: '10px' }}>💡 What should you do next?</p>
                    {savingsRate < savingsGoal && income > 0
                      ? <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.8 }}>
                          You are spending <strong style={{ color: '#fbbf24' }}>{fmt(totalThisMonth - (income * (1 - savingsGoal/100)))}</strong> more than ideal this month. Your biggest expense is <strong style={{ color: '#a5b4fc' }}>{allByCategory[0]?.cat ?? 'Food'}</strong> — try reducing that first to hit your saving target.
                        </p>
                      : savingsRate >= savingsGoal
                      ? <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.8 }}>
                          Great work! You saved <strong style={{ color: '#34d399' }}>{fmt(savings)}</strong> this month. Consider putting this into a <strong style={{ color: '#a5b4fc' }}>mutual fund or FD</strong> so your money grows over time instead of sitting idle.
                        </p>
                      : <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.8 }}>
                          Update your income in settings to get a personalised action plan for your savings and spending.
                        </p>
                    }
                  </div>

                </div>
              </div>
            </div>
          )
        })()}

        {/* ── LOANS TAB ── */}
        {tab === 'loans' && (() => {
          const pendingLoans = loans.filter(l => l.status === 'pending')
          const returnedLoans = loans.filter(l => l.status === 'returned')
          const today = new Date().toISOString().split('T')[0]

          const totalLent = pendingLoans.reduce((s, l) => s + l.amount, 0)
          const overdueLoans = pendingLoans.filter(l => l.return_date && l.return_date < today)

          const handleAddLoan = async (e: React.FormEvent) => {
            e.preventDefault()
            setLoanError('')
            if (!loanForm.person_name.trim() || !loanForm.amount) { setLoanError('Name and amount are required'); return }
            setSavingLoan(true)
            try {
              const res = await fetch('/api/loans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  person_name: loanForm.person_name.trim(),
                  amount: Number(loanForm.amount),
                  given_date: loanForm.given_date,
                  return_date: loanForm.return_date || null,
                  notes: loanForm.notes || null,
                }),
              })
              const data = await res.json()
              if (!res.ok) { setLoanError(data.error || 'Failed to add'); return }
              setLoans(prev => [data.loan, ...prev])
              setLoanForm({ person_name: '', amount: '', given_date: new Date().toISOString().split('T')[0], return_date: '', notes: '' })
              setShowLoanForm(false)
              setLoanSuccess('Loan added!')
              setTimeout(() => setLoanSuccess(''), 2500)
            } catch { setLoanError('An error occurred') } finally { setSavingLoan(false) }
          }

          const markReturned = async (id: string) => {
            const res = await fetch(`/api/loans/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'returned' }),
            })
            if (res.ok) setLoans(prev => prev.map(l => l.id === id ? { ...l, status: 'returned' } : l))
          }

          const deleteLoan = async (id: string) => {
            const res = await fetch(`/api/loans/${id}`, { method: 'DELETE' })
            if (res.ok) setLoans(prev => prev.filter(l => l.id !== id))
          }

          const fmt = (n: number) => n >= 1000 ? `₹${(n/1000).toFixed(1)}K` : `₹${n}`

          const LoanCard = ({ loan }: { loan: Loan }) => {
            const isOverdue = loan.return_date && loan.return_date < today && loan.status === 'pending'
            const daysLeft = loan.return_date ? Math.ceil((new Date(loan.return_date).getTime() - new Date(today).getTime()) / 86400000) : null
            return (
              <div style={{ background: isOverdue ? '#fef2f2' : '#f8fafc', border: `1px solid ${isOverdue ? '#fecaca' : '#e2e8f0'}`, borderRadius: '14px', padding: '16px 18px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: isOverdue ? '#fee2e2' : '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                      {loan.status === 'returned' ? '✅' : isOverdue ? '⚠️' : '🤝'}
                    </div>
                    <div>
                      <p style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>{loan.person_name}</p>
                      <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        Given {new Date(loan.given_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <p style={{ fontSize: '20px', fontWeight: 800, color: isOverdue ? '#ef4444' : '#0f172a', margin: 0 }}>{fmt(loan.amount)}</p>
                </div>

                {loan.return_date && (
                  <div style={{ padding: '6px 10px', borderRadius: '8px', background: isOverdue ? '#fee2e2' : daysLeft !== null && daysLeft <= 3 ? '#fffbeb' : '#f0fdf4', marginBottom: '10px', display: 'inline-block' }}>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: isOverdue ? '#b91c1c' : daysLeft !== null && daysLeft <= 3 ? '#92400e' : '#065f46', margin: 0 }}>
                      {isOverdue
                        ? `Overdue by ${Math.abs(daysLeft!)} day${Math.abs(daysLeft!) !== 1 ? 's' : ''}`
                        : daysLeft === 0 ? 'Due today'
                        : `Due in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} — ${new Date(loan.return_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                    </p>
                  </div>
                )}

                {loan.notes && <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>{loan.notes}</p>}

                {loan.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => markReturned(loan.id)} style={{ flex: 1, padding: '8px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Mark Returned ✓
                    </button>
                    <button onClick={() => deleteLoan(loan.id)} style={{ padding: '8px 12px', background: '#f1f5f9', color: '#ef4444', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
                      🗑
                    </button>
                  </div>
                )}
                {loan.status === 'returned' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>✅ Returned</span>
                    <button onClick={() => deleteLoan(loan.id)} style={{ padding: '4px 10px', background: 'none', color: '#94a3b8', border: 'none', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
                  </div>
                )}
              </div>
            )
          }

          return (
            <div style={{ maxWidth: '560px' }}>
              {/* Summary strip */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                {[
                  { label: 'Total Lent', value: fmt(totalLent), color: '#6366f1', bg: '#eef2ff' },
                  { label: 'Pending', value: String(pendingLoans.length), color: '#f59e0b', bg: '#fffbeb' },
                  { label: 'Overdue', value: String(overdueLoans.length), color: overdueLoans.length > 0 ? '#ef4444' : '#10b981', bg: overdueLoans.length > 0 ? '#fef2f2' : '#f0fdf4' },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} style={{ background: bg, borderRadius: '12px', padding: '12px 14px', border: `1px solid ${color}22` }}>
                    <p style={{ fontSize: '11px', color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>{label}</p>
                    <p style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0 }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Add button */}
              <button onClick={() => { setShowLoanForm(v => !v); setLoanError('') }} style={{ width: '100%', padding: '12px', background: showLoanForm ? '#f1f5f9' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: showLoanForm ? '#475569' : 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', marginBottom: '14px', fontFamily: 'inherit' }}>
                {showLoanForm ? '✕ Cancel' : '+ Record New Loan'}
              </button>

              {/* Add form */}
              {showLoanForm && (
                <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '18px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
                  {loanError && <div className="alert-error" style={{ marginBottom: '12px' }}>{loanError}</div>}
                  <form onSubmit={handleAddLoan}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <p style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '5px' }}>Person's Name *</p>
                        <input value={loanForm.person_name} onChange={e => setLoanForm(f => ({ ...f, person_name: e.target.value }))} placeholder="Venkatesh" style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' }} required />
                      </div>
                      <div>
                        <p style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '5px' }}>Amount (₹) *</p>
                        <input type="number" value={loanForm.amount} onChange={e => setLoanForm(f => ({ ...f, amount: e.target.value }))} placeholder="5000" style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' }} required />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <p style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '5px' }}>Given Date</p>
                        <input type="date" value={loanForm.given_date} onChange={e => setLoanForm(f => ({ ...f, given_date: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <p style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '5px' }}>Return Date</p>
                        <input type="date" value={loanForm.return_date} onChange={e => setLoanForm(f => ({ ...f, return_date: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                      </div>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '5px' }}>Notes (optional)</p>
                      <input value={loanForm.notes} onChange={e => setLoanForm(f => ({ ...f, notes: e.target.value }))} placeholder="e.g. for rent, emergency" style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                    </div>
                    <button type="submit" disabled={savingLoan} style={{ width: '100%', padding: '11px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: savingLoan ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                      {savingLoan ? <span className="dot-loader"><span/><span/><span/></span> : 'Save Loan'}
                    </button>
                  </form>
                </div>
              )}

              {loanSuccess && <div className="alert-success fade-in" style={{ marginBottom: '14px' }}>{loanSuccess}</div>}

              {loansLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>Loading…</div>
              ) : pendingLoans.length === 0 && returnedLoans.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '44px 0' }}>
                  <div style={{ fontSize: '40px', marginBottom: '10px' }}>🤝</div>
                  <p style={{ fontWeight: 600, color: '#475569', marginBottom: '4px' }}>No loans recorded</p>
                  <p style={{ fontSize: '13px', color: '#94a3b8' }}>Tap "+ Record New Loan" or send via Telegram:<br/><em>"gave 5000 venkatesh return 3 days"</em></p>
                </div>
              ) : (
                <>
                  {pendingLoans.length > 0 && (
                    <>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending ({pendingLoans.length})</p>
                      {pendingLoans.map(loan => <LoanCard key={loan.id} loan={loan} />)}
                    </>
                  )}

                  {returnedLoans.length > 0 && (
                    <>
                      <button onClick={() => setShowReturnedLoans(v => !v)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', background: 'none', border: 'none', borderTop: '1px solid #e2e8f0', cursor: 'pointer', marginTop: '8px', fontFamily: 'inherit' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Returned ({returnedLoans.length})</span>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>{showReturnedLoans ? '▲ Hide' : '▼ Show'}</span>
                      </button>
                      {showReturnedLoans && returnedLoans.map(loan => <LoanCard key={loan.id} loan={loan} />)}
                    </>
                  )}
                </>
              )}

              <div style={{ marginTop: '20px', padding: '14px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                  💬 <strong>Via Telegram:</strong> "gave 5000 venkatesh return 3 days" · "lent 2000 ram return next week"
                </p>
              </div>
            </div>
          )
        })()}

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
                        <input type={type} value={profileForm[id as keyof UserProfile] as string}
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

            {/* Telegram Connect */}
            <div style={{ ...card(), marginTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                <span style={{ fontSize: '24px' }}>✈️</span>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Log expenses via Telegram</p>
                  <p style={{ fontSize: '13px', color: '#64748b' }}>Send a message to the bot and it auto-adds the expense</p>
                </div>
              </div>

              {userProfile.telegram_chat_id ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#f0fdf4', borderRadius: '10px', marginTop: '12px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '16px' }}>✅</span>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#065f46' }}>Telegram is connected</p>
                  </div>
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }}>
                    Open your Telegram bot and send: <strong>"450 swiggy food"</strong> — it'll appear here instantly.
                  </p>
                  <button
                    onClick={async () => {
                      setTelegramLoading(true)
                      setTelegramMsg('')
                      try {
                        await fetch('/api/telegram/connect', { method: 'DELETE' })
                        setUserProfile(p => ({ ...p, telegram_chat_id: null }))
                        setTelegramCode(null)
                        setTelegramMsg('Disconnected.')
                      } finally {
                        setTelegramLoading(false)
                      }
                    }}
                    disabled={telegramLoading}
                    style={{ fontSize: '13px', color: '#ef4444', background: 'none', border: '1px solid #fecaca', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer' }}>
                    Disconnect Telegram
                  </button>
                </div>
              ) : telegramCode ? (
                <div style={{ marginTop: '12px' }}>
                  <p style={{ fontSize: '13px', color: '#475569', marginBottom: '10px' }}>
                    1. Open Telegram and search <strong>@{telegramBotUsername}</strong><br />
                    2. Send this code to the bot:
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: '#f8fafc', border: '1px dashed #c7d2fe', borderRadius: '10px', marginBottom: '10px' }}>
                    <code style={{ fontSize: '16px', fontWeight: 800, color: '#6366f1', letterSpacing: '1px', flex: 1 }}>{telegramCode}</code>
                    <button
                      onClick={() => { navigator.clipboard.writeText(telegramCode); setTelegramMsg('Copied!') }}
                      style={{ fontSize: '12px', color: '#6366f1', background: '#e0e7ff', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', flexShrink: 0 }}>
                      Copy
                    </button>
                  </div>
                  <p style={{ fontSize: '12px', color: '#94a3b8' }}>Code expires in 10 minutes. Once you send it, this page will show connected.</p>
                  {telegramMsg && <p style={{ fontSize: '13px', color: '#10b981', marginTop: '6px' }}>{telegramMsg}</p>}
                </div>
              ) : (
                <div style={{ marginTop: '12px' }}>
                  <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>
                    Example messages the bot understands:<br />
                    <strong style={{ color: '#475569' }}>"450 swiggy food" · "200 petrol" · "1500 electricity"</strong>
                  </p>
                  {telegramMsg && <p style={{ fontSize: '13px', color: '#ef4444', marginBottom: '8px' }}>{telegramMsg}</p>}
                  <button
                    onClick={async () => {
                      setTelegramLoading(true)
                      setTelegramMsg('')
                      try {
                        const res = await fetch('/api/telegram/connect', { method: 'POST' })
                        const data = await res.json()
                        if (data.already_connected) {
                          setUserProfile(p => ({ ...p, telegram_chat_id: 'connected' }))
                        } else if (data.code) {
                          setTelegramCode(data.code)
                          setTelegramBotUsername(data.bot_username || 'TrackPennyBot')
                        } else {
                          setTelegramMsg('Failed to generate code. Try again.')
                        }
                      } catch {
                        setTelegramMsg('Something went wrong. Try again.')
                      } finally {
                        setTelegramLoading(false)
                      }
                    }}
                    disabled={telegramLoading}
                    className={btnClass('primary')}
                    style={btn('linear-gradient(135deg,#6366f1,#8b5cf6)', 'white', { padding: '9px 20px' })}>
                    {telegramLoading ? <span className="dot-loader"><span/><span/><span/></span> : 'Connect Telegram'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile bottom nav — visible only on ≤640px */}
      <nav className="dash-bottom-nav">
        {([['expenses','💸','Expenses'],['analytics','📊','Analytics'],['loans','🤝','Lent'],['profile','👤','Profile']] as [Tab,string,string][]).map(([t, icon, label]) => (
          <button key={t} onClick={() => setTab(t)} className={tab === t ? 'active' : ''}>
            <span style={{ fontSize: '22px', lineHeight: 1 }}>{icon}</span>
            <span style={{ fontSize: '10px', marginTop: '2px' }}>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
