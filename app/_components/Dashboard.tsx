'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000
const WARNING_BEFORE_MS = 60 * 1000

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Other']

interface DashboardProps {
  username: string
  onLogout: () => void
}

interface Expense {
  id: string
  amount: number
  category: string
  description: string
  date: string
}

interface ExpenseForm {
  amount: string
  category: string
  description: string
  date: string
}

const emptyForm: ExpenseForm = {
  amount: '',
  category: 'Food',
  description: '',
  date: new Date().toISOString().split('T')[0],
}

type Tab = 'expenses' | 'profile'

interface UserProfile {
  full_name: string
  bio: string
  phone: string
  location: string
  website: string
  occupation: string
}

const emptyProfile: UserProfile = {
  full_name: '', bio: '', phone: '', location: '', website: '', occupation: '',
}

export default function Dashboard({ username, onLogout }: DashboardProps) {
  const [tab, setTab] = useState<Tab>('expenses')

  // Inactivity
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showInactivityWarning, setShowInactivityWarning] = useState(false)

  // Expenses state
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [expensesLoading, setExpensesLoading] = useState(true)
  const [expenseError, setExpenseError] = useState('')
  const [expenseSuccess, setExpenseSuccess] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [form, setForm] = useState<ExpenseForm>(emptyForm)
  const [isSavingExpense, setIsSavingExpense] = useState(false)
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7))
  const [filterCategory, setFilterCategory] = useState('All')

  // Profile state
  const [userProfile, setUserProfile] = useState<UserProfile>(emptyProfile)
  const [profileForm, setProfileForm] = useState<UserProfile>(emptyProfile)
  const [profileLoading, setProfileLoading] = useState(true)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    onLogout()
  }, [onLogout])

  const resetInactivityTimer = useCallback(() => {
    setShowInactivityWarning(false)
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    if (warningTimer.current) clearTimeout(warningTimer.current)
    warningTimer.current = setTimeout(() => setShowInactivityWarning(true), INACTIVITY_TIMEOUT_MS - WARNING_BEFORE_MS)
    inactivityTimer.current = setTimeout(() => handleLogout(), INACTIVITY_TIMEOUT_MS)
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

  // Load expenses
  const fetchExpenses = useCallback(async () => {
    setExpensesLoading(true)
    setExpenseError('')
    try {
      const params = new URLSearchParams({ month: filterMonth })
      if (filterCategory !== 'All') params.set('category', filterCategory)
      const res = await fetch(`/api/expenses?${params}`)
      if (res.status === 401) { handleLogout(); return }
      const data = await res.json()
      setExpenses(data.expenses ?? [])
    } catch {
      setExpenseError('Failed to load expenses')
    } finally {
      setExpensesLoading(false)
    }
  }, [filterMonth, filterCategory, handleLogout])

  useEffect(() => { fetchExpenses() }, [fetchExpenses])

  // Load profile
  useEffect(() => {
    const fetchProfile = async () => {
      setProfileLoading(true)
      try {
        const res = await fetch('/api/profile')
        if (res.status === 401) { handleLogout(); return }
        const data = await res.json()
        if (data.profile) {
          setUserProfile(data.profile)
          setProfileForm(data.profile)
        }
      } catch {
        setProfileError('Failed to load profile')
      } finally {
        setProfileLoading(false)
      }
    }
    fetchProfile()
  }, [handleLogout])

  // Expense handlers
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingExpense(true)
    setExpenseError('')

    const url = editingExpense ? `/api/expenses/${editingExpense.id}` : '/api/expenses'
    const method = editingExpense ? 'PATCH' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setExpenseError(data.error || 'Failed to save'); return }

      setExpenseSuccess(editingExpense ? 'Expense updated!' : 'Expense added!')
      setTimeout(() => setExpenseSuccess(''), 3000)
      setShowAddForm(false)
      setEditingExpense(null)
      setForm(emptyForm)
      fetchExpenses()
    } catch {
      setExpenseError('An error occurred')
    } finally {
      setIsSavingExpense(false)
    }
  }

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Delete this expense?')) return
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
      if (!res.ok) { setExpenseError('Failed to delete'); return }
      setExpenses(prev => prev.filter(e => e.id !== id))
      setExpenseSuccess('Expense deleted!')
      setTimeout(() => setExpenseSuccess(''), 3000)
    } catch {
      setExpenseError('An error occurred')
    }
  }

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense)
    setForm({ amount: String(expense.amount), category: expense.category, description: expense.description, date: expense.date })
    setShowAddForm(true)
  }

  const handleCancelForm = () => {
    setShowAddForm(false)
    setEditingExpense(null)
    setForm(emptyForm)
    setExpenseError('')
  }

  // Profile handlers
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingProfile(true)
    setProfileError('')
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      })
      const data = await res.json()
      if (!res.ok) { setProfileError(data.error || 'Failed to save'); return }
      setUserProfile(profileForm)
      setIsEditingProfile(false)
      setProfileSuccess('Profile saved!')
      setTimeout(() => setProfileSuccess(''), 3000)
    } catch {
      setProfileError('An error occurred')
    } finally {
      setIsSavingProfile(false)
    }
  }

  // Summary calculations
  const totalThisMonth = expenses.reduce((sum, e) => sum + e.amount, 0)
  const today = new Date().toISOString().split('T')[0]
  const totalToday = expenses.filter(e => e.date === today).reduce((sum, e) => sum + e.amount, 0)
  const byCategory = CATEGORIES.map(cat => ({
    cat,
    total: expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0),
  })).filter(x => x.total > 0)

  // Styles
  const s = {
    card: { backgroundColor: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '16px' },
    label: { color: '#999', fontSize: '12px', textTransform: 'uppercase' as const, marginBottom: '4px' },
    value: { color: '#333', fontSize: '20px', fontWeight: '700' as const },
    input: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '15px', boxSizing: 'border-box' as const },
    btn: (color: string, text = 'white') => ({ backgroundColor: color, color: text, border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' as const, fontSize: '14px' }),
    tag: (color: string) => ({ backgroundColor: color, color: 'white', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' as const }),
  }

  const categoryColor: Record<string, string> = {
    Food: '#ff6b6b', Transport: '#4ecdc4', Shopping: '#a29bfe',
    Bills: '#fd79a8', Health: '#55efc4', Entertainment: '#fdcb6e', Other: '#b2bec3',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* Inactivity Warning */}
        {showInactivityWarning && (
          <div style={{ backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '6px', padding: '12px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#856404', fontWeight: '500' }}>You will be logged out in 1 minute due to inactivity.</span>
            <button onClick={resetInactivityTimer} style={s.btn('#ffc107', '#212529')}>Stay logged in</button>
          </div>
        )}

        {/* Header */}
        <div style={{ ...s.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h1 style={{ margin: 0, color: '#333', fontSize: '22px' }}>Welcome, {username}!</h1>
            <p style={{ margin: 0, color: '#999', fontSize: '14px' }}>Manage your expenses and profile</p>
          </div>
          <button onClick={handleLogout} style={s.btn('#ff6b6b')}>Logout</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '4px', borderRadius: '8px', width: 'fit-content' }}>
          {(['expenses', 'profile'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 24px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '14px', backgroundColor: tab === t ? 'white' : 'transparent', color: tab === t ? '#667eea' : 'white', textTransform: 'capitalize' }}>
              {t}
            </button>
          ))}
        </div>

        {/* ── EXPENSES TAB ── */}
        {tab === 'expenses' && (
          <>
            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              <div style={s.card}>
                <p style={s.label}>Today</p>
                <p style={s.value}>${totalToday.toFixed(2)}</p>
              </div>
              <div style={s.card}>
                <p style={s.label}>This Month</p>
                <p style={s.value}>${totalThisMonth.toFixed(2)}</p>
              </div>
              <div style={s.card}>
                <p style={s.label}>Transactions</p>
                <p style={s.value}>{expenses.length}</p>
              </div>
            </div>

            {/* Category breakdown */}
            {byCategory.length > 0 && (
              <div style={{ ...s.card, marginBottom: '16px' }}>
                <p style={{ ...s.label, marginBottom: '12px' }}>Spending by Category</p>
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '8px' }}>
                  {byCategory.map(({ cat, total }) => (
                    <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f9f9f9', padding: '6px 12px', borderRadius: '20px' }}>
                      <span style={{ ...s.tag(categoryColor[cat] || '#999'), padding: '2px 8px' }}>{cat}</span>
                      <span style={{ fontWeight: '600', color: '#333', fontSize: '14px' }}>${total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filters + Add button */}
            <div style={{ ...s.card }}>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '10px', alignItems: 'flex-end', marginBottom: showAddForm ? '20px' : '0' }}>
                <div>
                  <p style={s.label}>Month</p>
                  <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ ...s.input, width: 'auto' }} />
                </div>
                <div>
                  <p style={s.label}>Category</p>
                  <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ ...s.input, width: 'auto' }}>
                    <option>All</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <button
                  onClick={() => { setShowAddForm(true); setEditingExpense(null); setForm(emptyForm) }}
                  style={{ ...s.btn('#667eea'), marginLeft: 'auto', padding: '10px 20px' }}
                >
                  + Add Expense
                </button>
              </div>

              {/* Add / Edit form */}
              {showAddForm && (
                <div style={{ borderTop: '1px solid #eee', paddingTop: '20px' }}>
                  <h3 style={{ margin: '0 0 16px', color: '#333' }}>{editingExpense ? 'Edit Expense' : 'New Expense'}</h3>
                  {expenseError && <div className="error-message">{expenseError}</div>}
                  <form onSubmit={handleSaveExpense}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <p style={s.label}>Amount ($)</p>
                        <input type="number" min="0.01" step="0.01" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" style={s.input} required disabled={isSavingExpense} />
                      </div>
                      <div>
                        <p style={s.label}>Category</p>
                        <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={s.input} disabled={isSavingExpense}>
                          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <p style={s.label}>Date</p>
                        <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} style={s.input} required disabled={isSavingExpense} />
                      </div>
                      <div>
                        <p style={s.label}>Description (optional)</p>
                        <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="e.g. Lunch at cafe" style={s.input} disabled={isSavingExpense} maxLength={200} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button type="submit" style={s.btn('#667eea')} disabled={isSavingExpense}>
                        {isSavingExpense ? 'Saving...' : editingExpense ? 'Update' : 'Save Expense'}
                      </button>
                      <button type="button" onClick={handleCancelForm} style={s.btn('#999')} disabled={isSavingExpense}>Cancel</button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Feedback */}
            {expenseSuccess && <div className="success-message">{expenseSuccess}</div>}
            {!showAddForm && expenseError && <div className="error-message">{expenseError}</div>}

            {/* Expenses list */}
            <div style={s.card}>
              {expensesLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ height: '56px', borderRadius: '6px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
                  ))}
                  <style>{`@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`}</style>
                </div>
              ) : expenses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                  <p style={{ fontSize: '32px', marginBottom: '8px' }}>💸</p>
                  <p>No expenses found. Add your first expense above.</p>
                </div>
              ) : (
                <div>
                  <p style={{ ...s.label, marginBottom: '12px' }}>
                    {expenses.length} expense{expenses.length !== 1 ? 's' : ''} — {filterMonth}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
                    {expenses.map(expense => (
                      <div key={expense.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '6px', flexWrap: 'wrap' as const }}>
                        <span style={s.tag(categoryColor[expense.category] || '#999')}>{expense.category}</span>
                        <span style={{ fontWeight: '700', color: '#333', fontSize: '16px', minWidth: '70px' }}>${expense.amount.toFixed(2)}</span>
                        <span style={{ color: '#555', flex: 1, fontSize: '14px' }}>{expense.description || '—'}</span>
                        <span style={{ color: '#999', fontSize: '13px' }}>{expense.date}</span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => handleEditExpense(expense)} style={s.btn('#a29bfe')}>Edit</button>
                          <button onClick={() => handleDeleteExpense(expense.id)} style={s.btn('#ff6b6b')}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── PROFILE TAB ── */}
        {tab === 'profile' && (
          <div style={s.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, color: '#333' }}>Profile Information</h2>
              {!isEditingProfile && (
                <button onClick={() => setIsEditingProfile(true)} style={s.btn('#667eea')}>Edit Profile</button>
              )}
            </div>

            {profileError && <div className="error-message">{profileError}</div>}
            {profileSuccess && <div className="success-message">{profileSuccess}</div>}

            {profileLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[1, 2, 3].map(i => <div key={i} style={{ height: '24px', borderRadius: '4px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />)}
              </div>
            ) : isEditingProfile ? (
              <form onSubmit={handleSaveProfile}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                  {[
                    { id: 'full_name', label: 'Full Name', type: 'text', placeholder: 'Your full name' },
                    { id: 'occupation', label: 'Occupation', type: 'text', placeholder: 'What do you do?' },
                    { id: 'phone', label: 'Phone', type: 'tel', placeholder: 'Your phone number' },
                    { id: 'location', label: 'Location', type: 'text', placeholder: 'City, Country' },
                    { id: 'website', label: 'Website', type: 'url', placeholder: 'https://yourwebsite.com' },
                  ].map(({ id, label, type, placeholder }) => (
                    <div key={id}>
                      <p style={s.label}>{label}</p>
                      <input type={type} value={profileForm[id as keyof UserProfile]} onChange={e => setProfileForm(p => ({ ...p, [id]: e.target.value }))} placeholder={placeholder} style={s.input} disabled={isSavingProfile} />
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <p style={s.label}>Bio</p>
                  <textarea value={profileForm.bio} onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))} placeholder="Tell us about yourself..." rows={3} disabled={isSavingProfile} style={{ ...s.input, resize: 'vertical', fontFamily: 'inherit' }} />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="submit" style={s.btn('#667eea')} disabled={isSavingProfile}>
                    {isSavingProfile ? 'Saving...' : 'Save Profile'}
                  </button>
                  <button type="button" onClick={() => { setIsEditingProfile(false); setProfileForm(userProfile); setProfileError('') }} style={s.btn('#999')} disabled={isSavingProfile}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                {[
                  { label: 'Full Name', value: userProfile.full_name },
                  { label: 'Occupation', value: userProfile.occupation },
                  { label: 'Phone', value: userProfile.phone },
                  { label: 'Location', value: userProfile.location },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p style={s.label}>{label}</p>
                    <p style={{ color: '#333', fontWeight: '600', fontSize: '16px' }}>{value || 'Not set'}</p>
                  </div>
                ))}
                <div>
                  <p style={s.label}>Website</p>
                  <p style={{ color: '#333', fontWeight: '600', fontSize: '16px' }}>
                    {userProfile.website
                      ? <a href={userProfile.website} target="_blank" rel="noopener noreferrer" style={{ color: '#667eea' }}>Visit</a>
                      : 'Not set'}
                  </p>
                </div>
                {userProfile.bio && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <p style={s.label}>Bio</p>
                    <p style={{ color: '#555', lineHeight: '1.6' }}>{userProfile.bio}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
