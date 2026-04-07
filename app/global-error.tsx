'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { Sentry.captureException(error) }, [error])

  return (
    <html>
      <body style={{ fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '16px', background: '#f8fafc', color: '#0f172a' }}>
        <p style={{ fontSize: '32px' }}>⚠️</p>
        <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Something went wrong</h2>
        <p style={{ fontSize: '14px', color: '#64748b' }}>Our team has been notified. Please try again.</p>
        <button onClick={reset} style={{ background: '#6366f1', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
          Try again
        </button>
      </body>
    </html>
  )
}
