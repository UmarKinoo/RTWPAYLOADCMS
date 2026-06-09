/**
 * ReadyBot is developed locally first. Off in production unless READYBOT_ENABLED=1.
 * Set READYBOT_ENABLED=1 in .env for local dev. Do not set on Vercel until go-live.
 */
import { NextResponse } from 'next/server'
import { notFound } from 'next/navigation'

export function isReadyBotEnabled(): boolean {
  const flag = process.env.READYBOT_ENABLED?.trim().toLowerCase()
  if (flag === '1' || flag === 'true' || flag === 'yes') return true
  if (flag === '0' || flag === 'false' || flag === 'no') return false
  // Unset: enabled in local dev only, disabled on Vercel/production deploys
  if (process.env.VERCEL === '1') return false
  return process.env.NODE_ENV !== 'production'
}

/** Gate API routes — returns 404 when ReadyBot is off (prod default). */
export function readyBotApiGuard(): NextResponse | null {
  if (!isReadyBotEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return null
}

/** Gate App Router pages — same behavior as API guard. */
export function assertReadyBotPageEnabled(): void {
  if (!isReadyBotEnabled()) notFound()
}
