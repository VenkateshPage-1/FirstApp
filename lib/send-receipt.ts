import { Resend } from 'resend'
import * as Sentry from '@sentry/nextjs'

const resend = new Resend(process.env.RESEND_API_KEY)

interface ReceiptOptions {
  to: string
  name: string
  plan: 'quarterly' | 'annual'
  amount: number
  paymentId: string
  premiumUntil: string
}

export async function sendPaymentReceipt(opts: ReceiptOptions) {
  const { to, name, plan, amount, paymentId, premiumUntil } = opts
  const planLabel = plan === 'annual' ? 'Annual Plan' : 'Quarterly Plan'
  const validUntil = new Date(premiumUntil).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
  const amountFormatted = `₹${(amount / 100).toFixed(0)}`

  try {
    await resend.emails.send({
      from: 'TrackPenny <receipts@trackpenny.com>',
      to,
      subject: `Payment confirmed — ${planLabel}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,-apple-system,sans-serif">
  <div style="max-width:520px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06)">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 36px;text-align:center">
      <p style="font-size:22px;font-weight:900;color:white;margin:0;letter-spacing:-0.5px">TrackPenny</p>
      <p style="font-size:13px;color:rgba(255,255,255,0.8);margin:6px 0 0">Premium activated</p>
    </div>

    <!-- Body -->
    <div style="padding:32px 36px">
      <p style="font-size:16px;color:#0f172a;margin:0 0 8px">Hi ${name},</p>
      <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 28px">
        Your payment was successful. You now have full access to TrackPenny Premium analytics.
      </p>

      <!-- Receipt box -->
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px;margin-bottom:28px">
        <p style="font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 16px">Payment Receipt</p>
        ${[
          ['Plan', planLabel],
          ['Amount paid', amountFormatted],
          ['Payment ID', paymentId],
          ['Premium valid until', validUntil],
        ].map(([label, value]) => `
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f1f5f9">
          <span style="font-size:13px;color:#64748b">${label}</span>
          <span style="font-size:13px;font-weight:600;color:#0f172a">${value}</span>
        </div>`).join('')}
      </div>

      <!-- What's unlocked -->
      <p style="font-size:13px;font-weight:600;color:#6366f1;margin:0 0 12px">What you've unlocked</p>
      ${['Financial Health Score (0–100)', '50/30/20 Rule tracker', 'EMI tracker & impact analysis', 'Category budget alerts', 'Month-end spending forecast'].map(f => `
      <p style="font-size:13px;color:#475569;margin:0 0 8px">✅ ${f}</p>`).join('')}

      <a href="https://trackpenny.com/app" style="display:block;text-align:center;margin-top:28px;background:#6366f1;color:white;padding:14px;border-radius:10px;font-weight:700;font-size:15px;text-decoration:none">
        Open TrackPenny →
      </a>
    </div>

    <!-- Footer -->
    <div style="padding:20px 36px;border-top:1px solid #f1f5f9;text-align:center">
      <p style="font-size:12px;color:#94a3b8;margin:0">
        Questions? Reply to this email.<br>
        © ${new Date().getFullYear()} TrackPenny · trackpenny.com
      </p>
    </div>

  </div>
</body>
</html>`,
    })
  } catch (err) {
    // Non-fatal — payment already succeeded, but track so we know about failures
    console.error('Receipt email failed:', err)
    Sentry.captureException(err, { extra: { to, paymentId } })
  }
}
