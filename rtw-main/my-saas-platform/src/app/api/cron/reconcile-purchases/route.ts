import { NextRequest, NextResponse } from 'next/server'
import { reconcilePendingPurchases } from '@/lib/fulfillPurchase'
import { verifyCronRequest } from '@/lib/cron/verify-cron-request'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Daily backstop for paid-but-unfulfilled MyFatoorah purchases: if neither the
 * browser callback nor the webhook completed fulfillment, this sweep grants the
 * credits and marks expired/cancelled invoices as failed.
 * Scheduled via vercel.json.
 */
export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await reconcilePendingPurchases(undefined, 50)
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    console.error('[cron/reconcile-purchases]', error)
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
