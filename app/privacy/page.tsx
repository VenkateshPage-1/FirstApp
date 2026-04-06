import Link from 'next/link'

export default function PrivacyPolicy() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '40px 20px' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto', backgroundColor: 'white', borderRadius: '8px', padding: '48px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
        <h1 style={{ color: '#333', marginBottom: '8px' }}>Privacy Policy</h1>
        <p style={{ color: '#999', fontSize: '14px', marginBottom: '32px' }}>Last updated: April 2026</p>

        {[
          {
            title: '1. Information We Collect',
            body: 'We collect your email address and password when you create an account. We also collect profile information you voluntarily provide, such as your name, bio, phone number, location, and website.',
          },
          {
            title: '2. How We Use Your Information',
            body: 'Your information is used solely to provide and improve our service. We do not sell, trade, or share your personal data with third parties for marketing purposes.',
          },
          {
            title: '3. Data Storage',
            body: 'Your data is stored securely using Supabase, a SOC 2 Type II certified database provider. Passwords are hashed and never stored in plain text.',
          },
          {
            title: '4. Cookies',
            body: 'We use a single HttpOnly session cookie to keep you logged in. This cookie cannot be accessed by JavaScript and is used solely for authentication. It expires after your session ends or after 30 days of inactivity.',
          },
          {
            title: '5. Your Rights',
            body: 'You have the right to access, update, or delete your personal data at any time. To request deletion of your account, contact us at the email below.',
          },
          {
            title: '6. Contact',
            body: 'For any privacy-related questions, please contact us at privacy@yourapp.com.',
          },
        ].map(({ title, body }) => (
          <div key={title} style={{ marginBottom: '28px' }}>
            <h2 style={{ color: '#333', fontSize: '18px', marginBottom: '10px' }}>{title}</h2>
            <p style={{ color: '#555', lineHeight: '1.7' }}>{body}</p>
          </div>
        ))}

        <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid #eee' }}>
          <Link href="/" style={{ color: '#667eea', textDecoration: 'none', fontWeight: '600' }}>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
