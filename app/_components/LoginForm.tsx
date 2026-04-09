'use client'

import { useState } from 'react'

interface LoginFormProps {
  onLogin: (username: string) => void
  onSwitchToSignup: () => void
}

export default function LoginForm({ onLogin, onSwitchToSignup }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Password fallback state
  const [isPasswordMode, setIsPasswordMode] = useState(false)
  const [password, setPassword] = useState('')
  const [isForgotMode, setIsForgotMode] = useState(false)
  const [resetMessage, setResetMessage] = useState('')

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!emailRegex.test(email.trim())) { setError('Please enter a valid email address'); return }
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to send code'); return }
      setOtpSent(true)
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), token: otpCode.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Invalid or expired code'); return }
      onLogin(data.user.username)
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Login failed'); setPassword(''); return }
      onLogin(data.user.username)
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      setResetMessage(data.message || 'Reset link sent to your email.')
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // ── Forgot password screen ──
  if (isForgotMode) {
    return (
      <div className="auth-bg">
        <div className="auth-card">
          <h1>Reset password</h1>
          <p className="auth-subtitle">We'll send a reset link to your email</p>
          {error && <div className="alert-error">{error}</div>}
          {resetMessage && <div className="alert-success">{resetMessage}</div>}
          {!resetMessage && (
            <form onSubmit={handleForgotPassword}>
              <div className="form-group">
                <label htmlFor="resetEmail">Email address</label>
                <input id="resetEmail" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" disabled={isLoading} autoComplete="email" required />
              </div>
              <button type="submit" className="btn-primary btn-ripple" disabled={isLoading}>
                {isLoading ? <span className="dot-loader"><span/><span/><span/></span> : 'Send reset link'}
              </button>
            </form>
          )}
          <div className="auth-footer">
            <button className="auth-link" onClick={() => { setIsForgotMode(false); setError(''); setResetMessage('') }}>← Back to login</button>
          </div>
        </div>
      </div>
    )
  }

  // ── Password login screen (fallback) ──
  if (isPasswordMode) {
    return (
      <div className="auth-bg">
        <div className="auth-card">
          <h1>Welcome back</h1>
          <p className="auth-subtitle">Sign in with your password</p>
          {error && <div className="alert-error">{error}</div>}
          <form onSubmit={handlePasswordLogin}>
            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" disabled={isLoading} autoComplete="email" required />
            </div>
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label htmlFor="password" style={{ margin: 0 }}>Password</label>
                <button type="button" className="auth-link" style={{ fontSize: '13px' }} onClick={() => { setIsForgotMode(true); setError('') }}>Forgot password?</button>
              </div>
              <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" disabled={isLoading} autoComplete="current-password" required />
            </div>
            <button type="submit" className="btn-primary btn-ripple" disabled={isLoading}>
              {isLoading ? <span className="dot-loader"><span/><span/><span/></span> : 'Sign in'}
            </button>
          </form>
          <div className="auth-footer">
            <button className="auth-link" onClick={() => { setIsPasswordMode(false); setError(''); setPassword('') }}>← Sign in with email code</button>
          </div>
        </div>
      </div>
    )
  }

  // ── OTP: enter code ──
  if (otpSent) {
    return (
      <div className="auth-bg">
        <div className="auth-card">
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📬</div>
            <h1 style={{ marginBottom: '6px' }}>Check your email</h1>
            <p className="auth-subtitle" style={{ marginBottom: '4px' }}>We sent a 6-digit code to</p>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>{email}</p>
          </div>

          {error && <div className="alert-error">{error}</div>}

          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label htmlFor="otpCode">Enter code</label>
              <input
                id="otpCode"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                disabled={isLoading}
                autoComplete="one-time-code"
                autoFocus
                style={{ letterSpacing: '0.25em', fontSize: '22px', textAlign: 'center', fontWeight: 700 }}
                required
              />
            </div>
            <button type="submit" className="btn-primary btn-ripple" disabled={isLoading || otpCode.length < 6}>
              {isLoading ? <span className="dot-loader"><span/><span/><span/></span> : 'Verify code →'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button type="button" className="auth-link" style={{ fontSize: '13px' }} onClick={() => { setOtpSent(false); setOtpCode(''); setError('') }}>
              Didn't get it? Resend code
            </button>
          </div>

          <div className="auth-footer">
            <button className="auth-link" onClick={() => { setOtpSent(false); setOtpCode(''); setError('') }}>← Change email</button>
          </div>
        </div>
      </div>
    )
  }

  // ── OTP: enter email (default screen) ──
  return (
    <div className="auth-bg">
      <div className="auth-card">
        <h1>Welcome back</h1>
        <p className="auth-subtitle">Enter your email — we'll send you a code</p>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSendOtp}>
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" disabled={isLoading} autoComplete="email" autoFocus required />
          </div>
          <button type="submit" className="btn-primary btn-ripple" disabled={isLoading}>
            {isLoading ? <span className="dot-loader"><span/><span/><span/></span> : 'Send code →'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '14px' }}>
          <button type="button" className="auth-link" style={{ fontSize: '13px', color: '#94a3b8' }} onClick={() => { setIsPasswordMode(true); setError('') }}>
            Sign in with password instead
          </button>
        </div>

        <div className="auth-footer">
          Don't have an account?{' '}
          <button className="auth-link" onClick={onSwitchToSignup}>Create one</button>
        </div>

        <p className="auth-legal">
          By continuing you agree to our{' '}
          <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>
        </p>
      </div>
    </div>
  )
}
