import { NextRequest, NextResponse } from 'next/server'
import { fulfillPurchaseByPaymentId } from '@/lib/fulfillPurchase'
import { getServerSideURL } from '@/utilities/getURL'

/**
 * MyFatoorah payment callback (success or error redirect).
 * Query: success=1|0, paymentId or PaymentId from MyFatoorah.
 */
export async function GET(request: NextRequest) {
  const baseUrl = getServerSideURL().replace(/\/$/, '')
  const searchParams = request.nextUrl.searchParams
  const paymentId = searchParams.get('paymentId') || searchParams.get('PaymentId')
  const successParam = searchParams.get('success')

  if (!paymentId) {
    return NextResponse.redirect(`${baseUrl}/en/pricing?payment=error&reason=missing_id`)
  }

  try {
    const result = await fulfillPurchaseByPaymentId(paymentId)
    const url = result.redirectPath.startsWith('http') ? result.redirectPath : `${baseUrl}${result.redirectPath}`
    return NextResponse.redirect(url)
  } catch (error) {
    console.error('Payment callback error:', error)
    return NextResponse.redirect(`${baseUrl}/en/pricing?payment=error`)
  }
}
