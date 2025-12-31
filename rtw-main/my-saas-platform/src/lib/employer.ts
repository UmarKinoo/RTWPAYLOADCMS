'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { loginUser } from './auth'
import type { Employer } from '@/payload-types'

export interface RegisterEmployerData {
  responsiblePerson: string
  companyName: string
  email: string
  password: string
  confirmPassword: string
  termsAccepted: boolean
}

export interface RegisterEmployerResponse {
  success: boolean
  error?: string
  employerId?: string
}

/**
 * Register a new employer
 */
export async function registerEmployer(
  data: RegisterEmployerData,
): Promise<RegisterEmployerResponse> {
  try {
    const payload = await getPayload({ config })

    // Validate inputs
    if (!data.responsiblePerson?.trim()) {
      return { success: false, error: 'Responsible person name is required' }
    }

    if (!data.companyName?.trim()) {
      return { success: false, error: 'Company name is required' }
    }

    if (!data.email?.trim()) {
      return { success: false, error: 'Email is required' }
    }

    if (!data.password || data.password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters long' }
    }

    if (data.password !== data.confirmPassword) {
      return { success: false, error: 'Passwords do not match' }
    }

    if (!data.termsAccepted) {
      return { success: false, error: 'You must accept the terms and conditions' }
    }

    // Check if employer with this email already exists
    const existing = await payload.find({
      collection: 'employers',
      where: {
        email: {
          equals: data.email.toLowerCase().trim(),
        },
      },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      return { success: false, error: 'An employer with this email already exists' }
    }

    // Create the employer
    const employer = await payload.create({
      collection: 'employers',
      data: {
        responsiblePerson: data.responsiblePerson.trim(),
        companyName: data.companyName.trim(),
        email: data.email.toLowerCase().trim(),
        password: data.password,
        termsAccepted: data.termsAccepted,
      },
    })

    // Log the employer in immediately after successful registration
    const loginResult = await loginUser({
      email: data.email,
      password: data.password,
      collection: 'employers',
    })

    if (!loginResult.success) {
      console.error('Failed to log in employer after registration:', loginResult.error)
      return {
        success: false,
        error: loginResult.error || 'Registration successful, but failed to log in.',
      }
    }

    revalidatePath('/employer/register')

    return {
      success: true,
      employerId: String(employer.id),
    }
  } catch (error: any) {
    console.error('Error registering employer:', error)
    return {
      success: false,
      error: error.message || 'Failed to register employer. Please try again.',
    }
  }
}

/**
 * Get the current employer profile
 * SECURITY: Only returns the employer profile for the currently authenticated user
 */
export async function getCurrentEmployer(): Promise<Employer | null> {
  try {
    const payload = await getPayload({ config })
    const headersList = await headers()

    // Get authenticated user
    const { user } = await payload.auth({ headers: headersList })

    if (!user) {
      console.warn('getCurrentEmployer: No authenticated user found')
      return null
    }

    // SECURITY: Only return employer if user is from employers collection
    if (user.collection !== 'employers') {
      return null
    }

    try {
      const employer = await payload.findByID({
        collection: 'employers',
        id: user.id,
        depth: 1, // Populate relationships
      })

      // SECURITY CHECK: Verify the employer's email matches the authenticated user's email
      if (employer.email !== user.email) {
        console.error('SECURITY WARNING: Employer email mismatch!', {
          employerEmail: employer.email,
          userEmail: user.email,
          employerId: employer.id,
          userId: user.id,
        })
        return null
      }

      return employer as Employer
    } catch (error) {
      console.warn('Employer not found by ID:', user.id)
      return null
    }
  } catch (error) {
    console.error('Error getting employer:', error)
    return null
  }
}
