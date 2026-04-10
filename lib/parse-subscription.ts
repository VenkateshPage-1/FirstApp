export interface ParsedSubscription {
  name: string
  amount: number
  billing_cycle: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
}

const SUB_KEYWORDS = ['subscribe', 'subscription', 'autopay', 'auto pay', 'recurring', 'plan']
const KNOWN_SERVICES = [
  'netflix', 'spotify', 'amazon prime', 'prime', 'hotstar', 'disney', 'youtube',
  'zee5', 'sonyliv', 'jiocinema', 'apple', 'google', 'microsoft', 'adobe',
  'swiggy one', 'zomato pro', 'linkedin', 'notion', 'slack', 'dropbox',
  'icloud', 'gpay', 'phonepe', 'paytm', 'airtel', 'jio', 'bsnl',
]

function detectCycle(text: string): 'weekly' | 'monthly' | 'quarterly' | 'yearly' {
  const lower = text.toLowerCase()
  if (lower.includes('week')) return 'weekly'
  if (lower.includes('year') || lower.includes('annual')) return 'yearly'
  if (lower.includes('quarter')) return 'quarterly'
  return 'monthly' // default
}

export function parseSubscription(text: string): ParsedSubscription | null {
  const lower = text.toLowerCase().trim()

  // Must have a subscription keyword OR be a known service
  const hasKeyword = SUB_KEYWORDS.some(k => lower.includes(k))
  const knownService = KNOWN_SERVICES.find(s => lower.includes(s))

  if (!hasKeyword && !knownService) return null

  // Extract amount
  const amountMatch = text.match(/\d+(\.\d+)?/)
  if (!amountMatch) return null
  const amount = parseFloat(amountMatch[0])
  if (amount <= 0) return null

  // Extract name — use known service name if found, else first word
  let name = ''
  if (knownService) {
    name = knownService.charAt(0).toUpperCase() + knownService.slice(1)
  } else {
    const cleaned = lower
      .replace(/\d+(\.\d+)?/g, '')
      .replace(/subscribe|subscription|autopay|auto pay|recurring|plan|monthly|yearly|weekly|quarterly|annual/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    const words = cleaned.split(' ').filter(w => w.length > 1)
    name = words[0] ? words[0].charAt(0).toUpperCase() + words[0].slice(1) : 'Subscription'
  }

  const billing_cycle = detectCycle(lower)

  return { name, amount, billing_cycle }
}
