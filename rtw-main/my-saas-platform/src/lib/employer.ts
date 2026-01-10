'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { randomBytes } from 'crypto'
import { sendEmail, verificationEmailTemplate } from './email'
import type { Employer } from '@/payload-types'

export interface RegisterEmployerData {
  responsiblePerson: string
  companyName: string
  email: string
  phone?: string
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

    // Generate email verification token
    const verificationToken = randomBytes(32).toString('hex')
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create the employer
    const employer = await payload.create({
      collection: 'employers',
      data: {
        responsiblePerson: data.responsiblePerson.trim(),
        companyName: data.companyName.trim(),
        email: data.email.toLowerCase().trim(),
        phone: data.phone?.trim() || null,
        password: data.password,
        termsAccepted: data.termsAccepted,
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires.toISOString(),
        phoneVerified: false, // Will be set to true after OTP verification
        wallet: {
          interviewCredits: 0,
          contactUnlockCredits: 0,
        },
      },
      draft: false,
    })

    // Send verification email
    const emailResult = await sendEmail({
      to: data.email.toLowerCase().trim(),
      subject: 'Verify your email address - Ready to Work',
      html: verificationEmailTemplate(data.email.toLowerCase().trim(), verificationToken, 'employer'),
    })

    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error)
      // Don't fail registration if email fails, but log it
      // User can request resend later
    }

    revalidatePath('/employer/register', 'page')

    return {
      success: true,
      employerId: String(employer.id),
    }
  } catch (error) {
    // SECURITY: Never log passwords or sensitive data
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error registering employer:', errorMessage)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to register employer. Please try again.',
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

    // SECURITY: Check user's collection first - only search by ID if user is from employers collection
    // IDs are not unique across collections (ID 3 in candidates ≠ ID 3 in employers)
    const userCollection = (user as any).collection
    
    if (userCollection === 'employers') {
      // User is from employers collection - safe to search by ID
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
        // Not found by ID, continue to email search
        console.warn('Employer not found by ID, trying email search:', user.id)
      }
    } else {
      // User is from candidates or users collection - skip ID search, go straight to email search
      // This prevents false matches when IDs happen to be the same across collections
      console.log(`User is from ${userCollection} collection, searching employer by email only`)
    }

    // Fallback: Search by email (works for both Users and Employers collections)
    // SECURITY: This should only be used if the user is from Users collection
    // and we need to find their employer profile
    try {
      const employers = await payload.find({
        collection: 'employers',
        where: {
          email: {
            equals: user.email,
          },
        },
        limit: 1,
        depth: 1,
      })

      if (employers.docs.length > 0) {
        const employer = employers.docs[0] as Employer
        
        // SECURITY CHECK: Double-check email matches
        if (employer.email !== user.email) {
          console.error('SECURITY WARNING: Employer email mismatch in fallback!', {
            employerEmail: employer.email,
            userEmail: user.email,
          })
          return null
        }

        return employer
      }
    } catch (searchError) {
      console.error('Error searching for employer by email:', searchError)
    }

    return null
  } catch (error) {
    console.error('Error getting employer:', error)
    return null
  }
}
