'use client'

import { useState, useEffect, useRef } from 'react'
import LoginForm from '../_components/LoginForm'
import SignupForm from '../_components/SignupForm'
import Dashboard from '../_components/Dashboard'

type View = 'loading' | 'login' | 'signup' | 'dashboard'

export default function AppPage() {
  const [view, setView] = useState<View>('login')
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const lastUser = useRef<string>('')
  const [animKey, setAnimKey] = useState(0)
  const [exiting, setExiting] = useState(false)
  const hasTransitioned = useRef(false)
  const pendingView = useRef<View | null>(null)
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/session')
        const data = await res.json()
        if (data.authenticated && data.user) {
          lastUser.current = data.user.username
          setCurrentUser(data.user.username)
          transitionTo('dashboard')
        }
      } catch {
        // Already showing login, ignore errors
      }
    }
    checkAuth()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const transitionTo = (next: View) => {
    if (pendingView.current === next) return
    if (transitionTimer.current) clearTimeout(transitionTimer.current)
    pendingView.current = next
    hasTransitioned.current = true
    setExiting(true)
    transitionTimer.current = setTimeout(() => {
      setExiting(false)
      setView(next)
      setAnimKey(k => k + 1)
      pendingView.current = null
      transitionTimer.current = null
    }, 150)
  }

  const handleLogin = (username: string) => {
    lastUser.current = username
    setCurrentUser(username)
    transitionTo('dashboard')
  }

  const handleLogout = () => {
    setCurrentUser(null)
    transitionTo('login')
  }

  const pageClass = exiting ? 'page-exit' : hasTransitioned.current ? 'page-enter' : ''

  if (view === 'dashboard') {
    return (
      <div key={animKey} className={pageClass}>
        <Dashboard username={currentUser ?? lastUser.current} onLogout={handleLogout} />
      </div>
    )
  }

  if (view === 'signup') {
    return (
      <div key={animKey} className={pageClass}>
        <SignupForm
          onSignup={handleLogin}
          onSwitchToLogin={() => transitionTo('login')}
        />
      </div>
    )
  }

  return (
    <div key={animKey} className={pageClass}>
      <LoginForm
        onLogin={handleLogin}
        onSwitchToSignup={() => transitionTo('signup')}
      />
    </div>
  )
}
