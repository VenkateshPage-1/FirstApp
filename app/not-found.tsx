import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="container">
      <div className="login-card" style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '64px', margin: '0', color: '#667eea' }}>404</h1>
        <h2 style={{ color: '#333', marginBottom: '10px' }}>Page Not Found</h2>
        <p style={{ color: '#666', marginBottom: '30px' }}>
          The page you are looking for does not exist.
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-block',
            backgroundColor: '#667eea',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '4px',
            textDecoration: 'none',
            fontWeight: '600',
          }}
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}
