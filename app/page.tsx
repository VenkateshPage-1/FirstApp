import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'TrackPenny — Free Expense Tracker & Budget Planner for India',
  description: 'Track daily expenses, manage budgets, and grow your savings with TrackPenny. Free expense tracking app for India with UPI payment support, EMI tracker, and financial health score.',
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
  featureList: [
    'Expense Tracking',
    'Budget Management',
    'EMI Tracker',
    'Financial Health Score',
    '50/30/20 Rule Tracker',
    'UPI Payment Tracking',
    'Month-end Forecast',
  ],
}

const features = [
  { icon: '📊', title: 'Financial Health Score', desc: 'Get a 0–100 score based on savings rate, budget adherence, EMI load, and spending consistency — updated every month.' },
  { icon: '💸', title: 'Expense Tracking', desc: 'Log expenses by category — Food, Transport, Bills, Health, Shopping and more. Filter by month, year, or category instantly.' },
  { icon: '🏦', title: 'EMI Tracker', desc: 'Add all your loan EMIs and see exactly how much disposable income you actually have each month after obligations.' },
  { icon: '📐', title: '50/30/20 Rule', desc: 'Automatically split your spending into Needs, Wants, and Savings and see how you measure against the proven budgeting rule.' },
  { icon: '🎯', title: 'Budget Alerts', desc: 'Set monthly limits per category. Get instant visibility when you are on track or overspending in any area.' },
  { icon: '📅', title: 'Month-end Forecast', desc: 'Based on your daily spending rate, TrackPenny predicts where you will end the month before it happens.' },
]

const steps = [
  { num: '1', title: 'Create your free account', desc: 'Sign up with email in under 30 seconds. No credit card required.' },
  { num: '2', title: 'Log your expenses', desc: 'Add expenses with category, amount, date, and payment method (UPI, Cash, Bank Transfer).' },
  { num: '3', title: 'Get insights that matter', desc: 'See your health score, savings trend, and exactly where your money is going each month.' },
]

const faqs = [
  { q: 'Is TrackPenny free to use?', a: 'Yes. Expense tracking, monthly reports, and category breakdown are completely free forever. Premium analytics (Financial Health Score, EMI tracker, budget alerts) are available for ₹99/quarter or ₹299/year.' },
  { q: 'Is my financial data safe?', a: 'Yes. All data is encrypted and stored securely. We use bank-grade authentication with HttpOnly cookies. We never sell your data to anyone.' },
  { q: 'Does TrackPenny support UPI payments?', a: 'Yes. You can tag each expense with its payment method — PhonePe, GPay, Bank Transfer, or Cash — so you know exactly which method you overspend on.' },
  { q: 'Can I track my EMIs and loans?', a: 'Yes. The premium EMI tracker lets you add all your loan EMIs with months remaining. TrackPenny factors these into your disposable income and financial health score.' },
  { q: 'What is the Financial Health Score?', a: 'It is a 0–100 score calculated from four components: savings rate (35pts), budget adherence (35pts), spending consistency (15pts), and EMI-to-income ratio (15pts). Based on the 50/30/20 rule and RBI lending guidelines.' },
  { q: 'Does it work on mobile?', a: 'Yes. TrackPenny is fully responsive and works on any smartphone browser. No app download required.' },
]

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#1e293b', overflowX: 'hidden' }}>

        {/* ── NAV ── */}
        <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #f1f5f9', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' }}>
          <span style={{ fontWeight: 800, fontSize: '18px', color: '#6366f1', letterSpacing: '-0.5px' }}>
            TrackPenny
          </span>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Link href="/app" style={{ fontSize: '14px', color: '#64748b', textDecoration: 'none', fontWeight: 500 }}>
              Login
            </Link>
            <Link href="/app" style={{ background: '#6366f1', color: 'white', padding: '8px 18px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
              Get Started Free
            </Link>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section style={{ background: 'linear-gradient(160deg, #f5f3ff 0%, #ede9fe 40%, #e0e7ff 100%)', padding: '80px 24px 72px', textAlign: 'center' }}>
          <div style={{ maxWidth: '680px', margin: '0 auto' }}>
            <div style={{ display: 'inline-block', background: '#e0e7ff', color: '#6366f1', fontSize: '13px', fontWeight: 600, padding: '4px 14px', borderRadius: '20px', marginBottom: '20px' }}>
              Free for Indian users · No app download needed
            </div>
            <h1 style={{ fontSize: 'clamp(32px, 6vw, 52px)', fontWeight: 900, lineHeight: 1.15, marginBottom: '20px', letterSpacing: '-1px', color: '#0f172a' }}>
              The smartest way to<br />
              <span style={{ color: '#6366f1' }}>track your expenses</span> in India
            </h1>
            <p style={{ fontSize: 'clamp(15px, 2.5vw, 18px)', color: '#64748b', lineHeight: 1.7, marginBottom: '36px', maxWidth: '560px', margin: '0 auto 36px' }}>
              Log expenses, set budgets, track EMIs, and get a personalised Financial Health Score — all in one free app built for how Indians actually spend money.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/app" style={{ background: '#6366f1', color: 'white', padding: '14px 28px', borderRadius: '12px', fontSize: '16px', fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>
                Start tracking for free →
              </Link>
              <Link href="/app" style={{ background: 'white', color: '#6366f1', padding: '14px 28px', borderRadius: '12px', fontSize: '16px', fontWeight: 600, textDecoration: 'none', border: '2px solid #e0e7ff', display: 'inline-block' }}>
                👀 Try demo first
              </Link>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '16px' }}>
              No credit card · No app download · Free forever
            </p>
          </div>
        </section>

        {/* ── STATS BAR ── */}
        <section style={{ background: '#6366f1', padding: '28px 24px' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', textAlign: 'center' }}>
            {[
              { num: '₹0', label: 'Cost to start' },
              { num: '6', label: 'Expense categories' },
              { num: '100', label: 'Point health score' },
            ].map(({ num, label }) => (
              <div key={label}>
                <p style={{ fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: 900, color: 'white', margin: 0 }}>{num}</p>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', margin: '4px 0 0' }}>{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section style={{ padding: '72px 24px', background: 'white' }} id="features">
          <div style={{ maxWidth: '960px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.5px' }}>
                Everything you need to control your money
              </h2>
              <p style={{ fontSize: '16px', color: '#64748b', maxWidth: '520px', margin: '0 auto', lineHeight: 1.6 }}>
                Built specifically for Indian spending habits — UPI, EMIs, and all.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {features.map(({ icon, title, desc }) => (
                <div key={title} style={{ background: '#fafafa', border: '1px solid #f1f5f9', borderRadius: '16px', padding: '24px', transition: 'box-shadow 0.2s' }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>{icon}</div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', color: '#0f172a' }}>{title}</h3>
                  <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section style={{ padding: '72px 24px', background: '#f8fafc' }} id="how-it-works">
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.5px' }}>
              Up and running in 2 minutes
            </h2>
            <p style={{ fontSize: '16px', color: '#64748b', marginBottom: '48px', lineHeight: 1.6 }}>
              No complicated setup. No tutorials. Just start tracking.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
              {steps.map(({ num, title, desc }) => (
                <div key={num} style={{ textAlign: 'center' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#6366f1', color: 'white', fontSize: '20px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>{num}</div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', color: '#0f172a' }}>{title}</h3>
                  <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section style={{ padding: '72px 24px', background: 'white' }} id="pricing">
          <div style={{ maxWidth: '780px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.5px' }}>
              Simple, honest pricing
            </h2>
            <p style={{ fontSize: '16px', color: '#64748b', marginBottom: '48px', lineHeight: 1.6 }}>
              Core tracking is free forever. Pay only for premium analytics.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', textAlign: 'left' }}>

              {/* Free */}
              <div style={{ border: '2px solid #e2e8f0', borderRadius: '16px', padding: '28px 24px' }}>
                <p style={{ fontWeight: 700, fontSize: '18px', marginBottom: '4px' }}>Free</p>
                <p style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a', marginBottom: '4px' }}>₹0</p>
                <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>Forever</p>
                {['Unlimited expense logging', 'Category breakdown', 'Monthly & yearly filters', 'UPI / Cash / Bank tagging', 'Add / edit / delete expenses'].map(f => (
                  <p key={f} style={{ fontSize: '14px', color: '#475569', marginBottom: '8px' }}>✅ {f}</p>
                ))}
                <Link href="/app" style={{ display: 'block', textAlign: 'center', marginTop: '20px', background: '#f1f5f9', color: '#1e293b', padding: '12px', borderRadius: '10px', fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}>
                  Get started free
                </Link>
              </div>

              {/* Premium */}
              <div style={{ border: '2px solid #6366f1', borderRadius: '16px', padding: '28px 24px', background: '#f5f3ff', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#6366f1', color: 'white', fontSize: '11px', fontWeight: 700, padding: '3px 12px', borderRadius: '20px', whiteSpace: 'nowrap' }}>MOST POPULAR</div>
                <p style={{ fontWeight: 700, fontSize: '18px', marginBottom: '4px' }}>Premium</p>
                <p style={{ fontSize: '32px', fontWeight: 900, color: '#6366f1', marginBottom: '4px' }}>₹99 <span style={{ fontSize: '15px', fontWeight: 500, color: '#94a3b8' }}>/quarter</span></p>
                <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>or ₹299/year (save 25%)</p>
                {['Everything in Free', 'Financial Health Score', '50/30/20 rule tracker', 'EMI tracker & impact', 'Category budget alerts', 'Month-end forecast'].map(f => (
                  <p key={f} style={{ fontSize: '14px', color: '#475569', marginBottom: '8px' }}>✅ {f}</p>
                ))}
                <Link href="/app" style={{ display: 'block', textAlign: 'center', marginTop: '20px', background: '#6366f1', color: 'white', padding: '12px', borderRadius: '10px', fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}>
                  Upgrade to Premium
                </Link>
              </div>

            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section style={{ padding: '72px 24px', background: '#f8fafc' }} id="faq">
          <div style={{ maxWidth: '680px', margin: '0 auto' }}>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, marginBottom: '48px', textAlign: 'center', letterSpacing: '-0.5px' }}>
              Frequently asked questions
            </h2>
            {faqs.map(({ q, a }) => (
              <div key={q} style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '24px', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', color: '#0f172a' }}>{q}</h3>
                <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.7, margin: 0 }}>{a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', padding: '72px 24px', textAlign: 'center' }}>
          <div style={{ maxWidth: '560px', margin: '0 auto' }}>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: 'white', marginBottom: '16px', letterSpacing: '-0.5px' }}>
              Start taking control of your money today
            </h2>
            <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.85)', marginBottom: '32px', lineHeight: 1.6 }}>
              Join thousands of Indians who track their expenses with TrackPenny. Free to start, takes 2 minutes.
            </p>
            <Link href="/app" style={{ display: 'inline-block', background: 'white', color: '#6366f1', padding: '16px 36px', borderRadius: '12px', fontSize: '16px', fontWeight: 800, textDecoration: 'none' }}>
              Create free account →
            </Link>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ background: '#0f172a', padding: '40px 24px', color: '#94a3b8' }}>
          <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <p style={{ fontWeight: 800, fontSize: '16px', color: 'white', margin: '0 0 4px' }}>TrackPenny</p>
              <p style={{ fontSize: '13px', margin: 0 }}>Expense tracker built for India</p>
            </div>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <Link href="/app" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '13px' }}>Login</Link>
              <Link href="/app" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '13px' }}>Sign Up</Link>
              <Link href="#features" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '13px' }}>Features</Link>
              <Link href="#pricing" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '13px' }}>Pricing</Link>
              <Link href="#faq" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '13px' }}>FAQ</Link>
            </div>
            <p style={{ fontSize: '12px', margin: 0 }}>© {new Date().getFullYear()} TrackPenny. All rights reserved.</p>
          </div>
        </footer>

      </div>
    </>
  )
}
