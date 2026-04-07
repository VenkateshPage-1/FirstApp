'use client'

import { useState } from 'react'

interface SignupFormProps {
  onSignup: (username: string) => void
  onSwitchToLogin: () => void
  onTryDemo: () => void
}

export default function SignupForm({ onSignup, onSwitchToLogin, onTryDemo }: SignupFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  // Live password strength
  const checks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
  }
  const strength = Object.values(checks).filter(Boolean).length

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address')
      setIsLoading(false)
      return
    }
    if (!checks.length) { setError('Password must be at least 8 characters'); setIsLoading(false); return }
    if (!checks.upper) { setError('Password must contain at least one uppercase letter'); setIsLoading(false); return }
    if (!checks.number) { setError('Password must contain at least one number'); setIsLoading(false); return }
    if (password !== confirmPassword) { setError('Passwords do not match'); setIsLoading(false); return }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Failed to create account')
        return
      }
      if (data.user) {
        onSignup(data.user.username)
      } else {
        setSuccess(data.message || 'Check your email to confirm your account.')
        setTimeout(() => onSwitchToLogin(), 4000)
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const strengthColors = ['#e2e8f0', '#ef4444', '#f59e0b', '#10b981']
  const strengthLabels = ['', 'Weak', 'Fair', 'Strong']

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <h1>Create account</h1>
        <p className="auth-subtitle">Start tracking your expenses today</p>

        {error && <div className="alert-error">{error}</div>}
        {success && <div className="alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" disabled={isLoading} autoComplete="email" required />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 chars, 1 uppercase, 1 number" disabled={isLoading} autoComplete="new-password" required />
            {password.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ flex: 1, height: '4px', borderRadius: '2px', backgroundColor: strength >= i ? strengthColors[strength] : '#e2e8f0', transition: 'background-color 0.2s' }} />
                  ))}
                </div>
                <p style={{ fontSize: '12px', color: strengthColors[strength], fontWeight: '500' }}>{strengthLabels[strength]}</p>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm password</label>
            <input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat your password" disabled={isLoading} autoComplete="new-password" required />
          </div>

          <button type="submit" className="btn-primary btn-ripple" disabled={isLoading}>
            {isLoading ? <span className="dot-loader"><span/><span/><span/></span> : 'Create account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <button className="auth-link" onClick={onSwitchToLogin}>Sign in</button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '8px' }}>
          <button className="auth-link" onClick={onTryDemo} style={{ fontSize: '13px', color: '#94a3b8' }}>
            👀 Try demo without signing up
          </button>
        </div>

        <p className="auth-legal">
          By signing up you agree to our{' '}
          <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>
        </p>
      </div>
    </div>
  )
}
