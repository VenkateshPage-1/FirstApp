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
    return <div className="container"><div className="login-card">Loading...</div></div>
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
