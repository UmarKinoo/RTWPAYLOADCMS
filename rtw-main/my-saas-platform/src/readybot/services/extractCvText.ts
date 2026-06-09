import { extractText, getDocumentProxy } from 'unpdf'

export async function fetchBufferFromUrl(url: string): Promise<Buffer> {
  const res = await fetch(url, { signal: AbortSignal.timeout(60_000) })
  if (!res.ok) throw new Error(`Failed to fetch CV: HTTP ${res.status}`)
  const ab = await res.arrayBuffer()
  return Buffer.from(ab)
}

export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer))
  const { text } = await extractText(pdf, { mergePages: true })
  const joined = Array.isArray(text) ? text.join('\n') : String(text ?? '')
  return joined.trim()
}

export async function extractCvTextFromUrl(url: string): Promise<string> {
  const buffer = await fetchBufferFromUrl(url)
  const mimeHint = url.toLowerCase()
  if (mimeHint.endsWith('.pdf') || mimeHint.includes('pdf')) {
    return extractTextFromPdfBuffer(buffer)
  }
  // Plain text or unknown — try UTF-8 decode
  const asText = buffer.toString('utf8').trim()
  if (asText.length > 50) return asText.slice(0, 80_000)
  return extractTextFromPdfBuffer(buffer).catch(() => asText)
}
