'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface LoginFormProps {
  onLogin: (username: string) => void
  onSwitchToSignup: () => void
}

export default function LoginForm({ onLogin, onSwitchToSignup }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isForgotMode, setIsForgotMode] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetMessage, setResetMessage] = useState('')
  const [isResetting, setIsResetting] = useState(false)

  // OTP state
  const [isOtpMode, setIsOtpMode] = useState(false)
  const [otpEmail, setOtpEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  const handleGoogleLogin = async () => {
    setError('')
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address')
      setIsLoading(false)
      return
    }
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Login failed')
        setPassword('')
        return
      }
      onLogin(data.user.username)
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!emailRegex.test(otpEmail.trim())) {
      setError('Please enter a valid email address')
      return
    }
    setOtpLoading(true)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to send code'); return }
      setOtpSent(true)
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setOtpLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setOtpLoading(true)
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail.trim(), token: otpCode.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Invalid code'); return }
      onLogin(data.user.username)
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setOtpLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!emailRegex.test(resetEmail.trim())) {
      setError('Please enter a valid email address')
      return
    }
    setIsResetting(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail.trim() }),
      })
      const data = await res.json()
      setResetMessage(data.message || 'Reset link sent.')
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setIsResetting(false)
    }
  }

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
                <input id="resetEmail" type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} placeholder="you@example.com" disabled={isResetting} autoComplete="email" required />
              </div>
              <button type="submit" className="btn-primary btn-ripple" disabled={isResetting}>
                {isResetting ? <span className="dot-loader"><span/><span/><span/></span> : 'Send reset link'}
              </button>
            </form>
          )}
          <div className="auth-footer">
            <button className="auth-link" onClick={() => { setIsForgotMode(false); setError(''); setResetMessage('') }}>
              Back to login
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (isOtpMode) {
    return (
      <div className="auth-bg">
        <div className="auth-card">
          <h1>Sign in with code</h1>
          <p className="auth-subtitle">
            {otpSent ? `Code sent to ${otpEmail}` : 'We\'ll email you a 6-digit code'}
          </p>
          {error && <div className="alert-error">{error}</div>}

          {!otpSent ? (
            <form onSubmit={handleSendOtp}>
              <div className="form-group">
                <label htmlFor="otpEmail">Email address</label>
                <input id="otpEmail" type="email" value={otpEmail} onChange={e => setOtpEmail(e.target.value)} placeholder="you@example.com" disabled={otpLoading} autoComplete="email" required />
              </div>
              <button type="submit" className="btn-primary btn-ripple" disabled={otpLoading}>
                {otpLoading ? <span className="dot-loader"><span/><span/><span/></span> : 'Send code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp}>
              <div className="form-group">
                <label htmlFor="otpCode">6-digit code</label>
                <input
                  id="otpCode"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  disabled={otpLoading}
                  autoComplete="one-time-code"
                  style={{ letterSpacing: '0.2em', fontSize: '20px', textAlign: 'center' }}
                  required
                />
              </div>
              <button type="submit" className="btn-primary btn-ripple" disabled={otpLoading || otpCode.length < 6}>
                {otpLoading ? <span className="dot-loader"><span/><span/><span/></span> : 'Verify code'}
              </button>
              <button type="button" className="auth-link" style={{ display: 'block', textAlign: 'center', marginTop: '14px', fontSize: '13px' }} onClick={() => { setOtpSent(false); setOtpCode(''); setError('') }}>
                Resend code
              </button>
            </form>
          )}

          <div className="auth-footer">
            <button className="auth-link" onClick={() => { setIsOtpMode(false); setOtpSent(false); setOtpCode(''); setError('') }}>
              Back to login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <h1>Welcome back</h1>
        <p className="auth-subtitle">Sign in to your account</p>

        {error && <div className="alert-error">{error}</div>}

        {/* Google button */}
        <button type="button" onClick={handleGoogleLogin} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '11px 16px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', fontWeight: 600, color: '#334155', cursor: 'pointer', marginBottom: '18px', fontFamily: 'inherit', transition: 'border-color 0.15s, box-shadow 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = '#6366f1')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
        >
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          Continue with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>or</span>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" disabled={isLoading} autoComplete="email" required />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label htmlFor="password" style={{ margin: 0 }}>Password</label>
              <button type="button" className="auth-link" style={{ fontSize: '13px' }} onClick={() => { setIsForgotMode(true); setError('') }}>
                Forgot password?
              </button>
            </div>
            <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" disabled={isLoading} autoComplete="current-password" required />
          </div>

          <button type="submit" className="btn-primary btn-ripple" disabled={isLoading}>
            {isLoading ? <span className="dot-loader"><span/><span/><span/></span> : 'Sign in'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '14px' }}>
          <button type="button" className="auth-link" style={{ fontSize: '13px' }} onClick={() => { setIsOtpMode(true); setError('') }}>
            Sign in with email code instead
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
