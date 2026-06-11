import type { NextRequest } from 'next/server'

/**
 * Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}` when CRON_SECRET is set.
 * @see https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs
 */
export function verifyCronRequest(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) {
    console.warn('[cron] CRON_SECRET is not set — rejecting scheduled request')
    return false
  }

  const auth = request.headers.get('authorization')
  return auth === `Bearer ${secret}`
}
