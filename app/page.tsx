'use client'

import { useState, useEffect, useRef } from 'react'
import LoginForm from './_components/LoginForm'
import SignupForm from './_components/SignupForm'
import Dashboard from './_components/Dashboard'
import DemoDashboard from './_components/DemoDashboard'

type View = 'loading' | 'login' | 'signup' | 'dashboard' | 'demo'

export default function Home() {
  const [view, setView] = useState<View>('loading')
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const lastUser = useRef<string>('')
  const [animKey, setAnimKey] = useState(0)
  const [exiting, setExiting] = useState(false)
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
          setView('dashboard')
        } else {
          setView('login')
        }
      } catch {
        setView('login')
      }
    }
    checkAuth()
  }, [])

  // Animate out current view, then swap in the new one
  const transitionTo = (next: View) => {
    if (pendingView.current === next) return
    if (transitionTimer.current) clearTimeout(transitionTimer.current)
    pendingView.current = next
    setExiting(true)
    transitionTimer.current = setTimeout(() => {
      setExiting(false)
      setView(next)
      setAnimKey(k => k + 1)
      pendingView.current = null
      transitionTimer.current = null
    }, 180)
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

  if (view === 'loading') {
    return <div className="auth-bg" />
  }

  const pageClass = exiting ? 'page-exit' : 'page-enter'

  if (view === 'dashboard') {
    return (
      <div key={animKey} className={pageClass}>
        <Dashboard username={currentUser ?? lastUser.current} onLogout={handleLogout} />
      </div>
    )
  }

  if (view === 'demo') {
    return (
      <div key={animKey} className={pageClass}>
        <DemoDashboard
          onSignup={() => transitionTo('signup')}
          onLogin={() => transitionTo('login')}
        />
      </div>
    )
  }

  if (view === 'signup') {
    return (
      <div key={animKey} className={pageClass}>
        <SignupForm
          onSignup={handleLogin}
          onSwitchToLogin={() => transitionTo('login')}
          onTryDemo={() => transitionTo('demo')}
        />
      </div>
    )
  }

  return (
    <div key={animKey} className={pageClass}>
      <LoginForm
        onLogin={handleLogin}
        onSwitchToSignup={() => transitionTo('signup')}
        onTryDemo={() => transitionTo('demo')}
      />
    </div>
  )
}
