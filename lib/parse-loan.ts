export interface ParsedLoan {
  person_name: string
  amount: number
  return_date: string | null // ISO date string or null
}

function parseReturnDate(text: string): string | null {
  const today = new Date()
  const lower = text.toLowerCase()

  // "return tomorrow" / "return 1 day"
  const daysMatch = lower.match(/(\d+)\s*day/)
  if (daysMatch) {
    const d = new Date(today)
    d.setDate(d.getDate() + parseInt(daysMatch[1]))
    return d.toISOString().split('T')[0]
  }

  // "return tomorrow"
  if (lower.includes('tomorrow')) {
    const d = new Date(today)
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  }

  // "return next week"
  if (lower.includes('next week') || lower.includes('1 week') || lower.match(/\d+\s*week/)) {
    const weeksMatch = lower.match(/(\d+)\s*week/)
    const weeks = weeksMatch ? parseInt(weeksMatch[1]) : 1
    const d = new Date(today)
    d.setDate(d.getDate() + weeks * 7)
    return d.toISOString().split('T')[0]
  }

  // "return next month"
  if (lower.includes('next month') || lower.includes('1 month') || lower.match(/\d+\s*month/)) {
    const monthsMatch = lower.match(/(\d+)\s*month/)
    const months = monthsMatch ? parseInt(monthsMatch[1]) : 1
    const d = new Date(today)
    d.setMonth(d.getMonth() + months)
    return d.toISOString().split('T')[0]
  }

  // "return 15 jan" / "return 15 january"
  const monthNames: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
    january: 0, february: 1, march: 2, april: 3, june: 5,
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  }
  const dateMatch = lower.match(/(\d{1,2})\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec\w*)/)
  if (dateMatch) {
    const day = parseInt(dateMatch[1])
    const month = monthNames[dateMatch[2].slice(0, 3)]
    if (month !== undefined) {
      const year = today.getMonth() > month ? today.getFullYear() + 1 : today.getFullYear()
      const d = new Date(year, month, day)
      return d.toISOString().split('T')[0]
    }
  }

  return null
}

export function parseLoan(text: string): ParsedLoan | null {
  const lower = text.toLowerCase().trim()

  // Must contain a loan keyword or "return" keyword to be detected as a loan
  const loanKeywords = ['lent', 'gave', 'given', 'loan', 'lend', 'borrowed by', 'give']
  const hasLoanKeyword = loanKeywords.some(k => lower.includes(k))
  const hasReturnKeyword = lower.includes('return')

  if (!hasLoanKeyword && !hasReturnKeyword) return null

  // Extract amount — first number in the text
  const amountMatch = text.match(/\d+(\.\d+)?/)
  if (!amountMatch) return null
  const amount = parseFloat(amountMatch[0])
  if (amount <= 0) return null

  // Remove amount, keywords, return phrase to isolate name
  let cleaned = lower
    .replace(/\d+(\.\d+)?/g, '')
    .replace(/lent|gave|given to|give to|given|loan to|loan|lend to|lend|borrowed by/g, '')
    .replace(/return\s*(in\s*)?(\d+\s*(day|week|month)s?|tomorrow|next\s*(week|month)|(\d{1,2}\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*))/gi, '')
    .replace(/return/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  // Clean punctuation and small words
  const stopWords = ['to', 'by', 'for', 'the', 'a', 'an', 'in', 'on', 'at', 'rupees', 'rs', '₹']
  const words = cleaned.split(/\s+/).filter(w => w.length > 1 && !stopWords.includes(w))

  if (!words.length) return null

  // Person name = first meaningful word, capitalized
  const person_name = words[0].charAt(0).toUpperCase() + words[0].slice(1)

  // Parse return date from full original text
  const returnSection = text.toLowerCase().match(/return\s+(.+)/)
  const return_date = returnSection ? parseReturnDate(returnSection[0]) : null

  return { person_name, amount, return_date }
}
