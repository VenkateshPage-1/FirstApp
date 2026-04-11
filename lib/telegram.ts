const BASE = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`

export async function sendMessage(chatId: number | string, text: string) {
  try {
    await fetch(`${BASE}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    })
  } catch (err) {
    console.error('Telegram sendMessage error:', err)
  }
}

export async function sendDocument(
  chatId: number | string,
  buffer: Buffer,
  filename: string,
  caption?: string,
) {
  try {
    const formData = new FormData()
    formData.append('chat_id', String(chatId))
    formData.append('document', new Blob([new Uint8Array(buffer)], { type: 'application/pdf' }), filename)
    if (caption) formData.append('caption', caption)
    formData.append('parse_mode', 'HTML')
    await fetch(`${BASE}/sendDocument`, { method: 'POST', body: formData })
  } catch (err) {
    console.error('Telegram sendDocument error:', err)
  }
}

export async function setWebhook(url: string) {
  const res = await fetch(`${BASE}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
  return res.json()
}
