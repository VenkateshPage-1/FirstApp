import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'TrackPenny — Free Expense Tracker & Budget Planner for India',
  description: 'Track daily expenses, manage budgets, and grow your savings with TrackPenny. Free expense tracking app for India with UPI support, EMI tracker, and financial health score.',
  keywords: 'expense tracker India, budget planner India, personal finance app, track daily expenses, money manager India, UPI expense tracker, EMI tracker, savings tracker India',
  openGraph: {
    title: 'TrackPenny — Free Expense Tracker for India',
    description: 'Track daily expenses, manage budgets, and grow your savings. Built for India with UPI support.',
    type: 'website',
    url: 'https://trackpenny.com',
    siteName: 'TrackPenny',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TrackPenny — Free Expense Tracker for India',
    description: 'Track daily expenses, manage budgets, and grow your savings.',
  },
  alternates: { canonical: 'https://trackpenny.com' },
  robots: { index: true, follow: true },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'TrackPenny',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web',
  description: 'Free expense tracker and budget planner for India with EMI tracker and financial health score.',
  url: 'https://trackpenny.com',
  offers: [
    { '@type': 'Offer', price: '0', priceCurrency: 'INR', name: 'Free Plan' },
    { '@type': 'Offer', price: '99', priceCurrency: 'INR', name: 'Premium Quarterly' },
    { '@type': 'Offer', price: '299', priceCurrency: 'INR', name: 'Premium Annual' },
  ],
}

const features = [
  { icon: '📊', title: 'Financial Health Score', desc: 'A 0–100 score based on savings rate, budget discipline, EMI load, and consistency. Know exactly where you stand.' },
  { icon: '💳', title: 'UPI & Payment Tracking', desc: 'Tag every expense — PhonePe, GPay, Bank Transfer, or Cash. See which payment method drains you most.' },
  { icon: '🏦', title: 'EMI Impact Analysis', desc: 'Add your loans and see real disposable income after obligations. Stop miscalculating what you can actually spend.' },
  { icon: '📐', title: '50/30/20 Rule Tracker', desc: 'Automatically split spending into Needs, Wants, and Savings. See how close you are to the ideal ratio.' },
  { icon: '🎯', title: 'Category Budgets', desc: 'Set monthly limits per category. Get instant visibility when you are overspending in any area.' },
  { icon: '📅', title: 'Month-end Forecast', desc: 'Based on your daily rate, TrackPenny predicts your total spend before the month ends.' },
]

const faqs = [
  { q: 'Is TrackPenny free to use?', a: 'Yes. Expense tracking, monthly reports, and category breakdown are completely free forever. Premium analytics are ₹99/quarter or ₹299/year.' },
  { q: 'Is my financial data safe?', a: 'All data is encrypted and stored securely. We use HttpOnly cookies and never expose your session tokens. We never sell your data.' },
  { q: 'Does it support UPI payments?', a: 'Yes. Tag each expense with PhonePe, GPay, Bank Transfer, or Cash — so you see exactly which method you overspend on.' },
  { q: 'Can I track EMIs and loans?', a: 'Yes. The premium EMI tracker lets you add all loans with months remaining. TrackPenny factors these into your disposable income and health score.' },
  { q: 'What is the Financial Health Score?', a: 'A 0–100 score from four components: savings rate (35pts), budget adherence (35pts), consistency (15pts), and EMI ratio (15pts) — based on the 50/30/20 rule and RBI lending guidelines.' },
  { q: 'Does it work on mobile?', a: 'Fully responsive. Works on any smartphone browser. No app download required.' },
]

export default function LandingPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <style dangerouslySetInnerHTML={{ __html: `
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fff;color:#0f172a;-webkit-font-smoothing:antialiased}
        .nav-link{color:#94a3b8;text-decoration:none;font-size:14px;font-weight:500;transition:color .15s}
        .nav-link:hover{color:#fff}
        .btn-primary{display:inline-block;background:#7c3aed;color:#fff;padding:11px 24px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;transition:background .15s}
        .btn-primary:hover{background:#6d28d9}
        .btn-ghost{display:inline-block;color:#7c3aed;padding:11px 24px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;border:1.5px solid #7c3aed;transition:all .15s}
        .btn-ghost:hover{background:#7c3aed;color:#fff}
        .feature-card{background:#f8fafc;border:1px solid #f1f5f9;border-radius:12px;padding:28px;transition:box-shadow .2s,border-color .2s}
        .feature-card:hover{box-shadow:0 4px 20px rgba(124,58,237,.08);border-color:#e9d5ff}
        .faq-item{border-bottom:1px solid #f1f5f9;padding:24px 0}
        .faq-item:last-child{border-bottom:none}
        .hero-img{transition:transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94),box-shadow 0.4s ease;cursor:zoom-in}
        .hero-img:hover{transform:scale(1.03);box-shadow:0 40px 100px rgba(0,0,0,0.7),0 0 0 1px rgba(139,92,246,0.3)}
        .plan-card{border:1.5px solid #e2e8f0;border-radius:16px;padding:32px 28px;transition:border-color .2s}
        .plan-card.featured{border-color:#7c3aed;background:#faf5ff}
        a{text-decoration:none}
        @media(max-width:640px){
          .hero-btns{flex-direction:column;align-items:stretch}
          .hero-btns a{text-align:center}
          .stat-grid{grid-template-columns:repeat(2,1fr)!important}
          .footer-inner{flex-direction:column;gap:24px;text-align:center}
          .footer-links{justify-content:center!important}
        }
      ` }} />

      {/* ── NAV ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(9,10,15,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 32px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 800, fontSize: '18px', color: '#fff', letterSpacing: '-0.5px' }}>
          Track<span style={{ color: '#a78bfa' }}>Penny</span>
        </span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Link href="#features" className="nav-link" style={{ marginRight: '8px' }}>Features</Link>
          <Link href="#pricing" className="nav-link" style={{ marginRight: '16px' }}>Pricing</Link>
          <Link href="/app" className="nav-link" style={{ marginRight: '8px' }}>Login</Link>
          <Link href="/app" className="btn-primary">Get started free</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ background: 'linear-gradient(180deg,#09090f 0%,#0d0a1a 100%)', padding: 'clamp(56px,9vw,110px) 24px clamp(56px,9vw,96px)', textAlign: 'center' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', color: '#4ade80', fontSize: '13px', fontWeight: 600, padding: '6px 16px', borderRadius: '20px', marginBottom: '28px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', display: 'inline-block', boxShadow: '0 0 6px #4ade80' }} />
            Log expenses without opening the app
          </div>

          <h1 style={{ fontSize: 'clamp(34px,7vw,62px)', fontWeight: 900, lineHeight: 1.1, color: '#fff', letterSpacing: '-2px', marginBottom: '24px' }}>
            Type it on Telegram.<br />
            <span style={{ color: '#a78bfa' }}>Done in a second.</span>
          </h1>

          <p style={{ fontSize: 'clamp(15px,2.5vw,18px)', color: '#94a3b8', lineHeight: 1.7, maxWidth: '560px', margin: '0 auto 40px' }}>
            Send <strong style={{ color: '#e2e8f0' }}>"450 swiggy food"</strong> to our Telegram bot — it lands in your dashboard instantly. No app, no login, no hassle.
          </p>

          <div className="hero-btns" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/app" className="btn-primary" style={{ padding: '14px 32px', fontSize: '16px', borderRadius: '10px' }}>
              Start tracking free →
            </Link>
            <Link href="/app" style={{ display: 'inline-block', color: '#94a3b8', padding: '14px 24px', fontSize: '15px', fontWeight: 500, border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', transition: 'border-color .15s' }}>
              👀 Try demo
            </Link>
          </div>

          <p style={{ marginTop: '20px', fontSize: '12px', color: '#475569' }}>
            No credit card · No app download · Works on any phone
          </p>
        </div>

        {/* Telegram → Dashboard image */}
        <div style={{ maxWidth: '820px', margin: '56px auto 0' }}>
          <div className="hero-img" style={{ position: 'relative', borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.15)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/My First Board.jpg"
              alt="Send expense on Telegram — appears in TrackPenny instantly"
              style={{ width: '100%', display: 'block', borderRadius: '20px' }}
            />
            {/* Glow overlay at bottom */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px', background: 'linear-gradient(transparent, rgba(9,9,15,0.8))', borderRadius: '0 0 20px 20px' }} />
          </div>
          {/* Caption */}
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>✈️</span>
            <p style={{ fontSize: '14px', color: '#64748b', fontStyle: 'italic' }}>
              Message on Telegram → expense saved → visible in your dashboard in under a second
            </p>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ background: '#09090f', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '40px 24px' }}>
        <div className="stat-grid" style={{ maxWidth: '800px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', textAlign: 'center' }}>
          {[
            { num: '₹0', sub: 'To get started' },
            { num: '6+', sub: 'Expense categories' },
            { num: '100pt', sub: 'Health score system' },
            { num: '4', sub: 'UPI payment modes' },
          ].map(({ num, sub }) => (
            <div key={sub}>
              <p style={{ fontSize: 'clamp(20px,4vw,32px)', fontWeight: 900, color: '#fff', letterSpacing: '-1px' }}>{num}</p>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: 'clamp(56px,8vw,96px) 24px', background: '#fff' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#7c3aed', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>Features</p>
            <h2 style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 800, letterSpacing: '-1px', marginBottom: '16px' }}>
              Everything to master your money
            </h2>
            <p style={{ fontSize: '16px', color: '#64748b', maxWidth: '480px', margin: '0 auto', lineHeight: 1.7 }}>
              Built specifically for Indian spending habits — EMIs, UPI, and all the real-world complexity.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(290px,1fr))', gap: '16px' }}>
            {features.map(({ icon, title, desc }) => (
              <div key={title} className="feature-card">
                <div style={{ fontSize: '28px', marginBottom: '14px' }}>{icon}</div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px', color: '#0f172a' }}>{title}</h3>
                <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: 'clamp(56px,8vw,96px) 24px', background: '#f8fafc' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#7c3aed', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>How it works</p>
          <h2 style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 800, letterSpacing: '-1px', marginBottom: '56px' }}>
            Up and running in 2 minutes
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '32px' }}>
            {[
              { num: '01', title: 'Create your free account', desc: 'Sign up with email in under 30 seconds. No credit card required.' },
              { num: '02', title: 'Log your expenses', desc: 'Add expenses with category, amount, date, and UPI payment method.' },
              { num: '03', title: 'Get insights', desc: 'See your health score, savings trend, and exactly where your money goes.' },
            ].map(({ num, title, desc }) => (
              <div key={num} style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 900, fontSize: '40px', color: '#e9d5ff', letterSpacing: '-2px', marginBottom: '12px' }}>{num}</p>
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px', color: '#0f172a' }}>{title}</h3>
                <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding: 'clamp(56px,8vw,96px) 24px', background: '#fff' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#7c3aed', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>Pricing</p>
          <h2 style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 800, letterSpacing: '-1px', marginBottom: '16px' }}>
            Simple, honest pricing
          </h2>
          <p style={{ fontSize: '16px', color: '#64748b', marginBottom: '48px', lineHeight: 1.7 }}>
            Core tracking is free forever. Upgrade for deep analytics.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '20px', textAlign: 'left' }}>

            <div className="plan-card">
              <p style={{ fontWeight: 700, fontSize: '16px', marginBottom: '6px', color: '#64748b' }}>Free</p>
              <p style={{ fontSize: '40px', fontWeight: 900, color: '#0f172a', letterSpacing: '-2px', marginBottom: '4px' }}>₹0</p>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '24px' }}>Forever, no card needed</p>
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                {['Unlimited expense logging', 'Category breakdown', 'Month & year filters', 'UPI / Cash / Bank tagging', 'Add · edit · delete'].map(f => (
                  <p key={f} style={{ fontSize: '14px', color: '#475569', marginBottom: '10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ color: '#10b981', fontWeight: 700 }}>✓</span> {f}
                  </p>
                ))}
              </div>
              <Link href="/app" style={{ display: 'block', textAlign: 'center', marginTop: '24px', background: '#f1f5f9', color: '#1e293b', padding: '13px', borderRadius: '8px', fontWeight: 600, fontSize: '14px' }}>
                Get started free
              </Link>
            </div>

            <div className="plan-card featured" style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-13px', left: '28px', background: '#7c3aed', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '3px 12px', borderRadius: '20px' }}>MOST POPULAR</div>
              <p style={{ fontWeight: 700, fontSize: '16px', marginBottom: '6px', color: '#7c3aed' }}>Premium</p>
              <p style={{ fontSize: '40px', fontWeight: 900, color: '#0f172a', letterSpacing: '-2px', marginBottom: '4px' }}>₹99</p>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '24px' }}>per quarter · or ₹299/year (save 25%)</p>
              <div style={{ borderTop: '1px solid #e9d5ff', paddingTop: '20px' }}>
                {['Everything in Free', 'Financial Health Score', '50/30/20 rule tracker', 'EMI tracker & analysis', 'Category budget alerts', 'Month-end forecast'].map(f => (
                  <p key={f} style={{ fontSize: '14px', color: '#475569', marginBottom: '10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ color: '#7c3aed', fontWeight: 700 }}>✓</span> {f}
                  </p>
                ))}
              </div>
              <Link href="/app" style={{ display: 'block', textAlign: 'center', marginTop: '24px', background: '#7c3aed', color: '#fff', padding: '13px', borderRadius: '8px', fontWeight: 600, fontSize: '14px' }}>
                Upgrade to Premium
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ padding: 'clamp(56px,8vw,96px) 24px', background: '#f8fafc' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#7c3aed', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px', textAlign: 'center' }}>FAQ</p>
          <h2 style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 800, letterSpacing: '-1px', marginBottom: '48px', textAlign: 'center' }}>
            Common questions
          </h2>
          {faqs.map(({ q, a }) => (
            <div key={q} className="faq-item">
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px', color: '#0f172a' }}>{q}</h3>
              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.7 }}>{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: 'linear-gradient(135deg,#09090f 0%,#1a0a2e 100%)', padding: 'clamp(64px,10vw,100px) 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(26px,4vw,44px)', fontWeight: 900, color: '#fff', letterSpacing: '-1.5px', marginBottom: '16px', lineHeight: 1.15 }}>
            Start tracking.<br />
            <span style={{ color: '#a78bfa' }}>Stop guessing.</span>
          </h2>
          <p style={{ fontSize: '16px', color: '#94a3b8', marginBottom: '36px', lineHeight: 1.7 }}>
            Free to start. Takes 2 minutes. No app download needed.
          </p>
          <Link href="/app" className="btn-primary" style={{ padding: '16px 40px', fontSize: '16px', fontWeight: 800, borderRadius: '10px' }}>
            Create free account →
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#09090f', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '32px 24px' }}>
        <div className="footer-inner" style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <p style={{ fontWeight: 800, fontSize: '15px', color: '#fff', marginBottom: '2px' }}>Track<span style={{ color: '#a78bfa' }}>Penny</span></p>
            <p style={{ fontSize: '12px', color: '#475569' }}>Expense tracker built for India</p>
          </div>
          <div className="footer-links" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {[
              { label: 'Features', href: '#features' },
              { label: 'Pricing', href: '#pricing' },
              { label: 'FAQ', href: '#faq' },
              { label: 'Login', href: '/app' },
              { label: 'Sign Up', href: '/app' },
            ].map(({ label, href }) => (
              <Link key={label} href={href} style={{ color: '#475569', fontSize: '13px', transition: 'color .15s' }}
                onMouseEnter={undefined}>{label}</Link>
            ))}
          </div>
          <p style={{ fontSize: '12px', color: '#334155' }}>© {new Date().getFullYear()} TrackPenny</p>
        </div>
      </footer>
    </>
  )
}
