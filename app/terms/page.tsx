import Link from 'next/link'

export default function TermsOfService() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '40px 20px' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto', backgroundColor: 'white', borderRadius: '8px', padding: '48px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
        <h1 style={{ color: '#333', marginBottom: '8px' }}>Terms of Service</h1>
        <p style={{ color: '#999', fontSize: '14px', marginBottom: '32px' }}>Last updated: April 2026</p>

        {[
          {
            title: '1. Acceptance of Terms',
            body: 'By accessing or using this application, you agree to be bound by these Terms of Service. If you do not agree, please do not use the service.',
          },
          {
            title: '2. Use of Service',
            body: 'You agree to use the service only for lawful purposes. You must not misuse the service, attempt unauthorized access, or interfere with other users.',
          },
          {
            title: '3. Account Responsibility',
            body: 'You are responsible for maintaining the confidentiality of your account credentials. You are responsible for all activity that occurs under your account.',
          },
          {
            title: '4. Prohibited Activities',
            body: 'You may not use the service to engage in fraud, harassment, distribution of malware, or any activity that violates applicable laws or regulations.',
          },
          {
            title: '5. Termination',
            body: 'We reserve the right to suspend or terminate your account at any time for violations of these terms, without prior notice.',
          },
          {
            title: '6. Disclaimer',
            body: 'The service is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the service.',
          },
          {
            title: '7. Changes to Terms',
            body: 'We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the new terms.',
          },
          {
            title: '8. Contact',
            body: 'For questions about these terms, contact us at legal@yourapp.com.',
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
