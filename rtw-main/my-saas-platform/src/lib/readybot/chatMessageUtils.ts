import type { UIMessage } from 'ai'

export function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('')
}

export function setMessageText(message: UIMessage, text: string): UIMessage {
  const nonText = message.parts.filter((p) => p.type !== 'text')
  return {
    ...message,
    parts: [{ type: 'text', text }, ...nonText],
  }
}

export function messagesToTranscript(messages: UIMessage[], maxChars = 12_000): string {
  const lines: string[] = []
  for (const m of messages) {
    const text = getMessageText(m).trim()
    if (!text) continue
    lines.push(`${m.role === 'user' ? 'Admin' : 'Assistant'}: ${text}`)
  }
  const joined = lines.join('\n')
  if (joined.length <= maxChars) return joined
  return joined.slice(joined.length - maxChars)
}
