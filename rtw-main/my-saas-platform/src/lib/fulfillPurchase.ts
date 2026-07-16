import { getPayload, type Payload, type Where } from 'payload'
import config from '@payload-config'
import { getPaymentStatus } from '@/lib/myfatoorah'
import { revalidatePath } from 'next/cache'
import { sendEmail } from '@/lib/email'
import { paymentSuccessEmailTemplate, paymentFailedEmailTemplate } from '@/lib/email-templates'
import { getServerSideURL } from '@/utilities/getURL'
import { defaultLocale } from '@/i18n/config'

/**
 * Notify the employer about the payment outcome (in-app + email).
 * Never throws — a notification failure must not break fulfillment.
 */
async function notifyEmployerPaymentResult(
  payload: Payload,
  params: {
    employerId: number
    employerEmail?: string | null
    companyName: string
    planTitle: string
    outcome: 'success' | 'failed'
    price?: string
    interviewCredits?: number
    contactUnlockCredits?: number
  },
): Promise<void> {
  const baseUrl = getServerSideURL().replace(/\/$/, '')
  try {
    await payload.create({
      collection: 'notifications',
      data: {
        employer: params.employerId,
        type: 'system',
        title: params.outcome === 'success' ? 'Payment successful' : 'Payment not completed',
        message:
          params.outcome === 'success'
            ? `Your payment for the ${params.planTitle} plan was received. ${params.interviewCredits || 0} interview credit(s) and ${params.contactUnlockCredits || 0} contact unlock credit(s) were added to your account.`
            : `Your payment for the ${params.planTitle} plan was not completed. No credits were added — you can try again from the pricing page.`,
        read: false,
        actionUrl: params.outcome === 'success' ? '/employer/dashboard' : '/pricing',
      },
    })
  } catch (error) {
    console.error('[fulfillPurchase] Failed to create payment notification:', error)
  }

  if (!params.employerEmail) return
  try {
    const html =
      params.outcome === 'success'
        ? paymentSuccessEmailTemplate({
            companyName: params.companyName,
            planTitle: params.planTitle,
            price: params.price,
            interviewCredits: params.interviewCredits || 0,
            contactUnlockCredits: params.contactUnlockCredits || 0,
            dashboardUrl: `${baseUrl}/${defaultLocale}/employer/dashboard`,
          })
        : paymentFailedEmailTemplate({
            companyName: params.companyName,
            planTitle: params.planTitle,
            pricingUrl: `${baseUrl}/${defaultLocale}/pricing`,
          })
    const result = await sendEmail({
      to: params.employerEmail,
      subject:
        params.outcome === 'success'
          ? 'Payment confirmed — credits added to your account'
          : 'Payment not completed - Ready to Work',
      html,
    })
    if (!result.success) {
      console.error('[fulfillPurchase] Failed to send payment email:', result.error)
    }
  } catch (error) {
    console.error('[fulfillPurchase] Failed to send payment email:', error)
  }
}

export interface FulfillResult {
  fulfilled: boolean
  redirectPath: string
  error?: string
}

interface FulfillOptions {
  /**
   * When true (browser callback flow), any non-Paid status marks the purchase failed.
   * When false (webhook/reconciliation), only terminal statuses (Expired/Canceled/Failed)
   * mark it failed — an invoice still open for payment stays pending.
   */
  treatUnpaidAsFailed: boolean
  /**
   * revalidatePath is only legal in server actions and route handlers.
   * Pass false when fulfilling during a page render (e.g. pricing page reconciliation).
   */
  revalidate?: boolean
}

const TERMINAL_UNPAID_STATUSES = ['expired', 'canceled', 'cancelled', 'failed']

/**
 * Verify payment with MyFatoorah and fulfill the purchase (grant credits).
 * The payment status is always fetched from MyFatoorah directly — callers must
 * never grant credits based on client- or webhook-supplied data alone.
 */
export async function fulfillPurchaseByKey(
  keyType: 'PaymentId' | 'InvoiceId',
  key: string,
  options: FulfillOptions,
): Promise<FulfillResult> {
  const payload = await getPayload({ config })

  const statusRes = await getPaymentStatus({
    KeyType: keyType,
    Key: key,
  })

  if (!statusRes.IsSuccess || !statusRes.Data) {
    return {
      fulfilled: false,
      redirectPath: '/en/pricing',
      error: statusRes.Message || 'Could not verify payment.',
    }
  }

  const invoiceStatus = statusRes.Data.InvoiceStatus
  const customerRef = statusRes.Data.CustomerReference || statusRes.Data.UserDefinedField
  const purchaseIdRaw = customerRef ? String(customerRef).trim() : null
  const purchaseId = purchaseIdRaw ? (Number(purchaseIdRaw) || purchaseIdRaw) : null

  if (!purchaseId) {
    return {
      fulfilled: false,
      redirectPath: '/en/pricing',
      error: 'No purchase reference in payment.',
    }
  }

  const numericPurchaseId = typeof purchaseId === 'string' ? Number(purchaseId) : purchaseId

  if (invoiceStatus !== 'Paid') {
    const isTerminal = TERMINAL_UNPAID_STATUSES.includes(String(invoiceStatus).toLowerCase())
    if (options.treatUnpaidAsFailed || isTerminal) {
      const existing = await payload.findByID({
        collection: 'purchases',
        id: numericPurchaseId,
      })
      // Only pending purchases may transition to failed — never downgrade an active one
      if (existing && existing.status === 'pending') {
        await payload.update({
          collection: 'purchases',
          id: numericPurchaseId,
          data: { status: 'failed' },
        })

        const failedEmployerId =
          typeof existing.employer === 'object' ? existing.employer.id : existing.employer
        try {
          const [failedEmployer, failedPlan] = await Promise.all([
            payload.findByID({ collection: 'employers', id: failedEmployerId, depth: 0 }),
            payload.findByID({
              collection: 'plans',
              id: typeof existing.plan === 'object' ? existing.plan.id : existing.plan,
              depth: 0,
            }),
          ])
          await notifyEmployerPaymentResult(payload, {
            employerId: failedEmployerId,
            employerEmail: failedEmployer?.email,
            companyName: failedEmployer?.companyName || failedEmployer?.email || 'there',
            planTitle: failedPlan?.title || failedPlan?.slug || 'selected',
            outcome: 'failed',
          })
        } catch (error) {
          console.error('[fulfillPurchase] Failed to notify employer of failed payment:', error)
        }
      }
    }
    return {
      fulfilled: false,
      redirectPath: '/en/pricing?payment=failed',
    }
  }

  const purchase = await payload.findByID({
    collection: 'purchases',
    id: numericPurchaseId,
  })
  if (!purchase || purchase.status !== 'pending') {
    return {
      fulfilled: true,
      redirectPath: '/en/pricing?payment=success',
    }
  }

  const plan = await payload.findByID({
    collection: 'plans',
    id: typeof purchase.plan === 'object' ? purchase.plan.id : purchase.plan,
  })
  const employer = await payload.findByID({
    collection: 'employers',
    id: typeof purchase.employer === 'object' ? purchase.employer.id : purchase.employer,
  })
  if (!plan || !employer) {
    return {
      fulfilled: false,
      redirectPath: '/en/pricing',
      error: 'Purchase data not found.',
    }
  }

  const interviewGranted = purchase.creditsGranted?.interviewCreditsGranted ?? plan.entitlements?.interviewCreditsGranted ?? 0
  const contactGranted = purchase.creditsGranted?.contactUnlockCreditsGranted ?? plan.entitlements?.contactUnlockCreditsGranted ?? 0
  const currentInterview = employer.wallet?.interviewCredits ?? 0
  const currentContact = employer.wallet?.contactUnlockCredits ?? 0

  await payload.update({
    collection: 'purchases',
    id: purchase.id,
    data: { status: 'active' },
  })
  await payload.update({
    collection: 'employers',
    id: employer.id,
    data: {
      wallet: {
        interviewCredits: currentInterview + interviewGranted,
        contactUnlockCredits: currentContact + contactGranted,
      },
      activePlan: plan.id,
      features: {
        basicFilters: plan.entitlements?.basicFilters ?? false,
        nationalityRestriction: plan.entitlements?.nationalityRestriction ?? 'NONE',
      },
    },
  })

  // Notify only on the real pending→active transition (guarded above), so the
  // duplicate triggers (callback + webhook + reconciliation) can't double-send
  await notifyEmployerPaymentResult(payload, {
    employerId: employer.id,
    employerEmail: employer.email,
    companyName: employer.companyName || employer.email || 'there',
    planTitle: plan.title || plan.slug || 'selected',
    outcome: 'success',
    price: plan.price != null ? `${plan.currency || 'SAR'} ${plan.price}` : undefined,
    interviewCredits: interviewGranted,
    contactUnlockCredits: contactGranted,
  })

  if (options.revalidate !== false) {
    revalidatePath('/pricing', 'page')
    revalidatePath('/candidates', 'page')
    revalidatePath('/dashboard', 'page')
  }

  return {
    fulfilled: true,
    redirectPath: '/en/pricing?payment=success',
  }
}

/**
 * Browser-callback flow: the user returned from the MyFatoorah payment page.
 * Used by the payment callback API route.
 */
export async function fulfillPurchaseByPaymentId(paymentId: string): Promise<FulfillResult> {
  return fulfillPurchaseByKey('PaymentId', paymentId, { treatUnpaidAsFailed: true })
}

/**
 * Sweep pending MyFatoorah purchases and fulfill any that were paid but never
 * completed the browser callback (user closed the tab after paying, dropped
 * connection, etc.). Terminal invoices (expired/cancelled) are marked failed so
 * they drop out of future sweeps.
 *
 * @param employerId - limit the sweep to one employer (e.g. on pricing page load)
 * @param revalidate - pass false when calling during a page render
 */
export async function reconcilePendingPurchases(
  employerId?: number,
  limit = 20,
  revalidate = true,
): Promise<{ checked: number; fulfilled: number }> {
  if (!process.env.MYFATOORAH_TOKEN?.trim()) {
    return { checked: 0, fulfilled: 0 }
  }

  const payload = await getPayload({ config })
  const conditions: Where[] = [
    { status: { equals: 'pending' } },
    { paymentGatewayId: { exists: true } },
    { source: { equals: 'myfatoorah' } },
  ]
  if (employerId) {
    conditions.push({ employer: { equals: employerId } })
  }

  const pending = await payload.find({
    collection: 'purchases',
    where: { and: conditions },
    limit,
    sort: '-createdAt',
    depth: 0,
  })

  let fulfilled = 0
  for (const purchase of pending.docs) {
    if (!purchase.paymentGatewayId) continue
    try {
      const result = await fulfillPurchaseByKey('InvoiceId', String(purchase.paymentGatewayId), {
        treatUnpaidAsFailed: false,
        revalidate,
      })
      if (result.fulfilled) fulfilled++
    } catch (error) {
      console.error(`[reconcilePendingPurchases] purchase ${purchase.id} failed:`, error)
    }
  }

  return { checked: pending.docs.length, fulfilled }
}
