import { NextRequest, NextResponse } from 'next/server'
import { fulfillPurchaseByKey } from '@/lib/fulfillPurchase'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * MyFatoorah server-to-server webhook (TransactionsStatusChanged).
 * Register this URL in the MyFatoorah portal: Settings → Webhook.
 *
 * This makes fulfillment independent of the buyer's browser returning to the
 * callback URL — credits are granted even if they close the tab after paying.
 *
 * Trust model: the webhook body is treated only as a hint (which invoice to
 * check). Fulfillment always re-verifies the payment status directly with the
 * MyFatoorah API, so a forged request can never grant credits for an unpaid
 * invoice — at worst it triggers a harmless status lookup.
 */
export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const data = (body as { Data?: Record<string, unknown> })?.Data
  const invoiceId =
    data?.InvoiceId ?? (data?.Invoice as Record<string, unknown> | undefined)?.Id

  if (!invoiceId) {
    // Not an event we handle (or malformed) — acknowledge so MyFatoorah stops retrying
    return NextResponse.json({ ok: true, skipped: true })
  }

  try {
    const result = await fulfillPurchaseByKey('InvoiceId', String(invoiceId), {
      treatUnpaidAsFailed: false,
    })
    return NextResponse.json({ ok: true, fulfilled: result.fulfilled })
  } catch (error) {
    console.error('[payment/webhook]', error)
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
