import { getPayload } from 'payload'
import config from '@payload-config'
import { getPaymentStatus } from '@/lib/myfatoorah'
import { revalidatePath } from 'next/cache'

/**
 * Verify payment with MyFatoorah and fulfill the purchase (grant credits).
 * Used by the payment callback API route.
 */
export async function fulfillPurchaseByPaymentId(paymentId: string): Promise<{
  fulfilled: boolean
  redirectPath: string
  error?: string
}> {
  const payload = await getPayload({ config })

  const statusRes = await getPaymentStatus({
    KeyType: 'PaymentId',
    Key: paymentId,
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

  if (invoiceStatus !== 'Paid') {
    const numericId = typeof purchaseId === 'string' ? Number(purchaseId) : purchaseId
    await payload.update({
      collection: 'purchases',
      id: numericId,
      data: { status: 'failed' },
    })
    return {
      fulfilled: false,
      redirectPath: '/en/pricing?payment=failed',
    }
  }

  const numericPurchaseId = typeof purchaseId === 'string' ? Number(purchaseId) : purchaseId
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

  revalidatePath('/pricing', 'page')
  revalidatePath('/candidates', 'page')
  revalidatePath('/dashboard', 'page')

  return {
    fulfilled: true,
    redirectPath: '/en/pricing?payment=success',
  }
}
