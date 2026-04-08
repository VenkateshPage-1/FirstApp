import Anthropic from '@anthropic-ai/sdk'

export interface ParsedExpense {
  amount: number
  category: string
  description: string
}

const VALID_CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Education', 'Other']

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Food: ['food', 'swiggy', 'zomato', 'restaurant', 'lunch', 'dinner', 'breakfast', 'cafe', 'coffee', 'tea', 'hotel', 'eat', 'meal', 'snack', 'groceries', 'grocery', 'vegetables', 'fruits', 'milk', 'bread'],
  Transport: ['petrol', 'diesel', 'fuel', 'uber', 'ola', 'auto', 'bus', 'train', 'metro', 'taxi', 'cab', 'transport', 'travel', 'flight', 'ticket', 'parking'],
  Shopping: ['amazon', 'flipkart', 'shopping', 'clothes', 'shirt', 'shoes', 'dress', 'mall', 'market', 'buy', 'purchase', 'myntra', 'meesho'],
  Bills: ['electricity', 'electric', 'bill', 'water', 'gas', 'internet', 'wifi', 'broadband', 'recharge', 'mobile', 'phone', 'rent', 'maintenance', 'society'],
  Health: ['medicine', 'doctor', 'hospital', 'pharmacy', 'medical', 'clinic', 'health', 'gym', 'fitness'],
  Entertainment: ['movie', 'netflix', 'hotstar', 'amazon prime', 'spotify', 'game', 'entertainment', 'outing', 'party', 'fun'],
  Education: ['school', 'college', 'tuition', 'course', 'book', 'fee', 'education', 'class', 'coaching'],
}

// Rule-based fallback — works without AI for simple formats like "450 swiggy food"
function parseSimple(text: string): ParsedExpense | null {
  const lower = text.toLowerCase().trim()
  // Extract first number found
  const match = lower.match(/\d+(\.\d+)?/)
  if (!match) return null
  const amount = parseFloat(match[0])
  if (amount <= 0) return null

  // Remove the number and common filler words
  const words = lower.replace(/\d+(\.\d+)?/, '').replace(/\b(spent|paid|on|for|at|rs|inr|rupees|₹)\b/g, '').trim().split(/\s+/).filter(Boolean)

  // Match category from remaining words
  let category = 'Other'
  for (const word of words) {
    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some(k => word.includes(k) || k.includes(word))) {
        category = cat
        break
      }
    }
    if (category !== 'Other') break
  }

  const description = words.slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Expense'

  return { amount, category, description }
}

export async function parseExpense(text: string): Promise<ParsedExpense | null> {
  // Try AI first if API key is available
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const msg = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `You are an expense parser. Extract expense details and return JSON only — no explanation, no markdown.

Valid categories: ${VALID_CATEGORIES.join(', ')}

Message: "${text}"

If expense: {"amount": <number>, "category": "<category>", "description": "<1-3 words>"}
If not an expense: {"error": "not an expense"}`,
        }],
      })

      const raw = (msg.content[0] as { text: string }).text.trim()
      const parsed = JSON.parse(raw)
      if (!parsed.error && parsed.amount && parsed.category) {
        if (!VALID_CATEGORIES.includes(parsed.category)) parsed.category = 'Other'
        return { amount: Number(parsed.amount), category: parsed.category, description: parsed.description || text }
      }
    } catch {
      // Fall through to simple parser
    }
  }

  // Fallback: rule-based parser (no API needed)
  return parseSimple(text)
}
