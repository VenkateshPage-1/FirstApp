'use client'

import { useState, useEffect } from 'react'
import LoginForm from './_components/LoginForm'
import SignupForm from './_components/SignupForm'
import Dashboard from './_components/Dashboard'

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSignupMode, setIsSignupMode] = useState(false)

  // Check session via server API (reads the __s HttpOnly cookie)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/session')
        const data = await res.json()

        if (data.authenticated && data.user) {
          setCurrentUser(data.user.username)
          setIsLoggedIn(true)
        }
      } catch (error) {
        console.error('Auth check error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const handleLogin = (username: string) => {
    setCurrentUser(username)
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    // Dashboard already called /api/auth/logout which cleared the cookie + DB session
    setCurrentUser(null)
    setIsLoggedIn(false)
    setIsSignupMode(false)
  }

  if (isLoading) {
    return (
      <div className="container">
        <div className="login-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ height: '32px', width: '60%', borderRadius: '6px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
          <div style={{ height: '48px', borderRadius: '6px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
          <div style={{ height: '48px', borderRadius: '6px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
          <div style={{ height: '48px', width: '100%', borderRadius: '6px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
          <style>{`@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`}</style>
        </div>
      </div>
    )
  }

  if (isLoggedIn) {
    return <Dashboard username={currentUser!} onLogout={handleLogout} />
  }

  return isSignupMode ? (
    <SignupForm
      onSignup={handleLogin}
      onSwitchToLogin={() => setIsSignupMode(false)}
    />
  ) : (
    <LoginForm
      onLogin={handleLogin}
      onSwitchToSignup={() => setIsSignupMode(true)}
    />
  )
}
