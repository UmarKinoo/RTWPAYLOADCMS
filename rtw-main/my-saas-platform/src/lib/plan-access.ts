import type { Employer, Plan } from '@/payload-types'

/**
 * Compute planExpiresAt from now + plan.validityDays (default 30).
 */
export function computePlanExpiresAt(
  validityDays?: number | null,
  from: Date = new Date(),
): string {
  const days = validityDays && validityDays > 0 ? validityDays : 30
  const expires = new Date(from)
  expires.setDate(expires.getDate() + days)
  return expires.toISOString()
}

export function isPlanActive(planExpiresAt?: string | null, now: Date = new Date()): boolean {
  if (!planExpiresAt) return false
  return new Date(planExpiresAt).getTime() > now.getTime()
}

export function getActivePlanFromEmployer(
  employer: Pick<Employer, 'activePlan'>,
): Plan | null {
  return typeof employer.activePlan === 'object' && employer.activePlan ? employer.activePlan : null
}

/**
 * Whether the employer may send interview requests right now.
 */
export function canRequestInterview(employer: {
  planExpiresAt?: string | null
  wallet?: { interviewCredits?: number | null } | null
  activePlan?: (number | null) | Plan
}): {
  allowed: boolean
  unlimited: boolean
  code?: 'NO_CREDITS' | 'PLAN_EXPIRED'
  error?: string
} {
  const plan = getActivePlanFromEmployer(employer as Pick<Employer, 'activePlan'>)
  const unlimited = Boolean(plan?.entitlements?.unlimitedInterviews)
  const active = isPlanActive(employer.planExpiresAt)

  if (!active) {
    // Legacy: no expiry set but still has credits — allow credit-based use
    if (!employer.planExpiresAt && (employer.wallet?.interviewCredits || 0) > 0) {
      return { allowed: true, unlimited: false }
    }
    if (employer.planExpiresAt) {
      return {
        allowed: false,
        unlimited,
        code: 'PLAN_EXPIRED',
        error: 'Your plan has expired. Please purchase a plan to send interview requests.',
      }
    }
    return {
      allowed: false,
      unlimited: false,
      code: 'NO_CREDITS',
      error: 'You have no interview credits. Please purchase a plan to send interview requests.',
    }
  }

  if (unlimited) {
    return { allowed: true, unlimited: true }
  }

  if ((employer.wallet?.interviewCredits || 0) <= 0) {
    return {
      allowed: false,
      unlimited: false,
      code: 'NO_CREDITS',
      error: 'You have no interview credits. Please purchase a plan to send interview requests.',
    }
  }

  return { allowed: true, unlimited: false }
}

/**
 * Build payment-success notification / email body for a plan purchase.
 */
export function buildPlanPurchaseMessage(plan: {
  title?: string | null
  slug?: string | null
  entitlements?: {
    interviewCreditsGranted?: number | null
    contactUnlockCreditsGranted?: number | null
    unlimitedInterviews?: boolean | null
    validityDays?: number | null
  } | null
}): string {
  const name = plan.title || plan.slug || 'selected'
  const cvs = plan.entitlements?.contactUnlockCreditsGranted || 0
  const days = plan.entitlements?.validityDays || 30
  const interviewPart = plan.entitlements?.unlimitedInterviews
    ? `Unlimited interviews for ${days} days`
    : `${plan.entitlements?.interviewCreditsGranted || 0} interview credit(s)`
  const cvPart =
    cvs > 0
      ? `${cvs} CV(s) will be shared with you by our operations team`
      : 'no CVs included'
  return `Your ${name} plan is active for ${days} days. ${interviewPart}. ${cvPart}.`
}
