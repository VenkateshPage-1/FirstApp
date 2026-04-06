'use client'

import { useState } from 'react'

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

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password')
      setIsLoading(false)
      return
    }

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
        setIsLoading(false)
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
    setResetMessage('')
    setError('')

    if (!resetEmail.trim() || !emailRegex.test(resetEmail.trim())) {
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
      <div className="container">
        <div className="login-card">
          <h1>Reset Password</h1>

          {error && <div className="error-message">{error}</div>}
          {resetMessage && <div className="success-message">{resetMessage}</div>}

          {!resetMessage && (
            <form onSubmit={handleForgotPassword}>
              <div className="form-group">
                <label htmlFor="resetEmail">Email</label>
                <input
                  id="resetEmail"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={isResetting}
                  autoComplete="email"
                  required
                />
              </div>
              <button type="submit" className="submit-btn" disabled={isResetting}>
                {isResetting ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button
              onClick={() => { setIsForgotMode(false); setError(''); setResetMessage('') }}
              style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', textDecoration: 'underline', fontSize: '14px' }}
            >
              Back to login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="login-card">
        <h1>Login</h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={isLoading}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={isLoading}
              autoComplete="current-password"
              required
            />
          </div>

          <div style={{ textAlign: 'right', marginBottom: '16px', marginTop: '-10px' }}>
            <button
              type="button"
              onClick={() => { setIsForgotMode(true); setError('') }}
              style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', textDecoration: 'underline', fontSize: '13px' }}
            >
              Forgot password?
            </button>
          </div>

          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #eee', textAlign: 'center' }}>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Don't have an account?{' '}
            <button
              onClick={onSwitchToSignup}
              style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', textDecoration: 'underline', fontSize: '14px', fontWeight: '600' }}
            >
              Sign up here
            </button>
          </p>
        </div>

        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #eee', textAlign: 'center' }}>
          <p style={{ color: '#999', fontSize: '12px' }}>
            By logging in you agree to our{' '}
            <a href="/terms" style={{ color: '#667eea' }}>Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" style={{ color: '#667eea' }}>Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  )
}
