'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

export interface MockPurchaseResponse {
  success: boolean
  error?: string
  wallet?: {
    interviewCredits: number
    contactUnlockCredits: number
  }
}

/**
 * Mock purchase endpoint - creates a purchase and grants credits to employer
 * @param planSlug - The slug of the plan to purchase
 */
export async function mockPurchase(planSlug: string): Promise<MockPurchaseResponse> {
  try {
    const payload = await getPayload({ config })
    const headersList = await headers()

    // Get authenticated employer
    const { user } = await payload.auth({ headers: headersList })

    if (!user) {
      return {
        success: false,
        error: 'Not authenticated. Please log in as an employer.',
      }
    }

    // Verify user is from employers collection
    if (user.collection !== 'employers') {
      return {
        success: false,
        error: 'Only employers can make purchases.',
      }
    }

    // Find plan by slug
    const plans = await payload.find({
      collection: 'plans',
      where: {
        slug: {
          equals: planSlug,
        },
      },
      limit: 1,
    })

    if (plans.docs.length === 0) {
      return {
        success: false,
        error: 'Plan not found',
      }
    }

    const plan = plans.docs[0]

    // Don't process custom plans - they should route to request form
    if (plan.entitlements?.isCustom) {
      return {
        success: false,
        error: 'Custom plans require a request form. Please contact support.',
      }
    }

    // Get current employer with wallet
    const employer = await payload.findByID({
      collection: 'employers',
      id: user.id,
    })

    if (!employer) {
      return {
        success: false,
        error: 'Employer profile not found',
      }
    }

    // Create purchase record
    const purchase = await payload.create({
      collection: 'purchases',
      data: {
        employer: user.id,
        plan: plan.id,
        status: 'active',
        creditsGranted: {
          interviewCreditsGranted: plan.entitlements?.interviewCreditsGranted || 0,
          contactUnlockCreditsGranted: plan.entitlements?.contactUnlockCreditsGranted || 0,
        },
        source: 'mock_checkout',
      },
    })

    // Update employer wallet
    const currentInterviewCredits = employer.wallet?.interviewCredits || 0
    const currentContactUnlockCredits = employer.wallet?.contactUnlockCredits || 0

    const newInterviewCredits =
      currentInterviewCredits + (plan.entitlements?.interviewCreditsGranted || 0)
    const newContactUnlockCredits =
      currentContactUnlockCredits + (plan.entitlements?.contactUnlockCreditsGranted || 0)

    // Update employer with new credits and features
    await payload.update({
      collection: 'employers',
      id: user.id,
      data: {
        wallet: {
          interviewCredits: newInterviewCredits,
          contactUnlockCredits: newContactUnlockCredits,
        },
        activePlan: plan.id,
        features: {
          basicFilters: plan.entitlements?.basicFilters || false,
          nationalityRestriction: plan.entitlements?.nationalityRestriction || 'NONE',
        },
      },
    })

    revalidatePath('/pricing', 'page')
    revalidatePath('/candidates', 'page')
    revalidatePath('/dashboard', 'page')

    return {
      success: true,
      wallet: {
        interviewCredits: newInterviewCredits,
        contactUnlockCredits: newContactUnlockCredits,
      },
    }
  } catch (error: any) {
    console.error('Error processing mock purchase:', error)
    return {
      success: false,
      error: error?.message || 'Failed to process purchase. Please try again.',
    }
  }
}



