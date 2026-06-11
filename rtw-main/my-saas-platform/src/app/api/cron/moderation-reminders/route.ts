import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { sendCandidateModerationReminders } from '@/lib/admin/candidate-moderation-reminders'
import { verifyCronRequest } from '@/lib/cron/verify-cron-request'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Daily digest when profiles sit in the moderation queue 24h+.
 * Scheduled via vercel.json — not Trigger.dev / ReadyBot.
 */
export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload = await getPayload({ config })
    const result = await sendCandidateModerationReminders(payload)
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    console.error('[cron/moderation-reminders]', error)
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
