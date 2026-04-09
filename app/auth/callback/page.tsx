'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthCallback() {
  const router = useRouter()
  const [error, setError] = useState('')

  useEffect(() => {
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)
    const access_token = params.get('access_token')
    const refresh_token = params.get('refresh_token')
    const expires_in = parseInt(params.get('expires_in') ?? '3600')
    const error_description = params.get('error_description')

    if (error_description) {
      setError(decodeURIComponent(error_description))
      return
    }

    if (!access_token) {
      router.replace('/app')
      return
    }

    fetch('/api/auth/google-callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token, refresh_token, expires_in }),
    }).then(res => {
      if (res.ok) {
        router.replace('/app')
      } else {
        setError('Sign-in failed. Please try again.')
      }
    }).catch(() => {
      setError('Sign-in failed. Please try again.')
    })
  }, [router])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      {error ? (
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#ef4444', marginBottom: '16px', fontSize: '15px' }}>{error}</p>
          <a href="/app" style={{ color: '#6366f1', fontSize: '14px', textDecoration: 'none', fontWeight: 600 }}>← Back to login</a>
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <div style={{ width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ fontSize: '15px' }}>Signing you in…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}
    </div>
  )
}
