import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface ParsedExpense {
  amount: number
  category: string
  description: string
}

const VALID_CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Education', 'Other']

export async function parseExpense(text: string): Promise<ParsedExpense | null> {
  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `You are an expense parser. Extract expense details from this message and return JSON only — no explanation, no markdown.

Valid categories: ${VALID_CATEGORIES.join(', ')}

Message: "${text}"

If this is an expense, return:
{"amount": <number>, "category": "<category>", "description": "<short description>"}

If this is NOT an expense (e.g. a question, greeting, or random text), return:
{"error": "not an expense"}

Rules:
- amount must be a positive number
- Pick the closest matching category
- description should be short (1-3 words), like "Swiggy", "Petrol", "Electricity"`
      }],
    })

    const raw = (msg.content[0] as { text: string }).text.trim()
    const parsed = JSON.parse(raw)

    if (parsed.error || !parsed.amount || !parsed.category) return null
    if (!VALID_CATEGORIES.includes(parsed.category)) parsed.category = 'Other'

    return {
      amount: Number(parsed.amount),
      category: parsed.category,
      description: parsed.description || text,
    }
  } catch {
    return null
  }
}
