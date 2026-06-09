/**
 * Console logging for CLI scans (`pnpm readybot:scan`).
 * Set READYBOT_VERBOSE=0 to silence.
 */

const PREFIX = '[ReadyBot]'

export function isReadyBotTerminalVerbose(): boolean {
  return process.env.READYBOT_VERBOSE !== '0'
}

export function readyBotTerminalLog(message: string, detail?: Record<string, unknown>): void {
  if (!isReadyBotTerminalVerbose()) return
  const ts = new Date().toISOString()
  if (detail && Object.keys(detail).length > 0) {
    console.log(`${PREFIX} ${ts} ${message}`, JSON.stringify(detail, null, 2))
  } else {
    console.log(`${PREFIX} ${ts} ${message}`)
  }
}

/** Strip undefined keys so logs match what Payload likely receives */
export function stripUndefined<T extends Record<string, unknown>>(data: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined),
  ) as Partial<T>
}

type PayloadLikeError = {
  message?: string
  name?: string
  status?: number
  data?: { errors?: unknown[]; [key: string]: unknown }
  errors?: unknown[]
  cause?: unknown
}

/** Payload validation / API errors often hide field paths in .data.errors */
export function formatPayloadError(err: unknown): string {
  if (!(err instanceof Error)) return String(err)
  const e = err as Error & PayloadLikeError
  const parts: string[] = [e.message]
  const nested = e.data?.errors ?? e.errors
  if (Array.isArray(nested) && nested.length > 0) {
    parts.push(`errors: ${JSON.stringify(nested, null, 2)}`)
  }
  if (e.data && typeof e.data === 'object' && !Array.isArray(e.data.errors)) {
    const { errors: _e, ...rest } = e.data
    if (Object.keys(rest).length > 0) parts.push(`data: ${JSON.stringify(rest, null, 2)}`)
  }
  if (e.cause) parts.push(`cause: ${formatPayloadError(e.cause)}`)
  return parts.join('\n')
}

export function readyBotTerminalError(
  message: string,
  err: unknown,
  detail?: Record<string, unknown>,
): void {
  if (!isReadyBotTerminalVerbose()) return
  const ts = new Date().toISOString()
  console.error(`${PREFIX} ${ts} ${message}`)
  if (detail && Object.keys(detail).length > 0) {
    console.error(JSON.stringify(detail, null, 2))
  }
  console.error(formatPayloadError(err))
}
