'use client'

import { useState } from 'react'

interface LoginFormProps {
  onLogin: (username: string) => void
  onSwitchToSignup: () => void
  onTryDemo: () => void
}

export default function LoginForm({ onLogin, onSwitchToSignup, onTryDemo }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isForgotMode, setIsForgotMode] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetMessage, setResetMessage] = useState('')
  const [isResetting, setIsResetting] = useState(false)

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <h1>Welcome back</h1>
        <p className="auth-subtitle">Sign in to your account</p>

        {error && <div className="alert-error">{error}</div>}

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

        <div className="auth-footer">
          Don't have an account?{' '}
          <button className="auth-link" onClick={onSwitchToSignup}>Create one</button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '8px' }}>
          <button className="auth-link" onClick={onTryDemo} style={{ fontSize: '13px', color: '#94a3b8' }}>
            👀 Try demo without signing up
          </button>
        </div>

        <p className="auth-legal">
          By continuing you agree to our{' '}
          <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>
        </p>
      </div>
    </div>
  )
}
