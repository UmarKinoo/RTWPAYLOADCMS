'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import type { Candidate } from '@/payload-types'

export interface RegisterCandidateData {
  // Identity
  firstName: string
  lastName: string
  email: string
  password: string
  phone: string
  whatsapp?: string

  // Smart Matrix
  primarySkill: string // Skill ID

  // Demographics
  gender: 'male' | 'female'
  dob: string
  nationality: string
  languages: string

  // Work
  jobTitle: string
  experienceYears: number
  saudiExperience: number
  currentEmployer?: string
  availabilityDate: string

  // Visa
  location: string
  visaStatus: 'active' | 'expired' | 'nearly_expired' | 'none'
  visaExpiry?: string
  visaProfession?: string

  // Terms
  termsAccepted: boolean
}

export interface RegisterCandidateResponse {
  success: boolean
  error?: string
  candidateId?: string
}

export async function registerCandidate(
  data: RegisterCandidateData,
): Promise<RegisterCandidateResponse> {
  try {
    const payload = await getPayload({ config })

    // Validate terms acceptance
    if (!data.termsAccepted) {
      return {
        success: false,
        error: 'You must accept the terms and conditions',
      }
    }

    // Helper function to validate and clean date strings
    const cleanDate = (dateString: string | undefined): string | undefined => {
      if (!dateString || dateString.trim() === '') {
        return undefined
      }
      // Validate the date is valid
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return undefined
      }
      // Return in YYYY-MM-DD format (Payload expects this format)
      return date.toISOString().split('T')[0]
    }

    // Validate and format required date fields
    if (!data.dob || data.dob.trim() === '') {
      return {
        success: false,
        error: 'Date of birth is required',
      }
    }

    const dobDate = new Date(data.dob)
    if (isNaN(dobDate.getTime())) {
      return {
        success: false,
        error: 'Invalid date of birth',
      }
    }
    const formattedDob = dobDate.toISOString().split('T')[0]

    if (!data.availabilityDate || data.availabilityDate.trim() === '') {
      return {
        success: false,
        error: 'Availability date is required',
      }
    }

    const availabilityDateObj = new Date(data.availabilityDate)
    if (isNaN(availabilityDateObj.getTime())) {
      return {
        success: false,
        error: 'Invalid availability date',
      }
    }
    const formattedAvailabilityDate = availabilityDateObj.toISOString().split('T')[0]

    // Create candidate (this will also create auth user)
    const candidate = await payload.create({
      collection: 'candidates',
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        phone: data.phone,
        whatsapp: data.whatsapp || data.phone, // Use phone if whatsapp not provided
        primarySkill: parseInt(data.primarySkill, 10),
        gender: data.gender,
        dob: formattedDob, // Required field, formatted as YYYY-MM-DD
        nationality: data.nationality,
        languages: data.languages,
        jobTitle: data.jobTitle,
        experienceYears: data.experienceYears,
        saudiExperience: data.saudiExperience,
        currentEmployer: data.currentEmployer || undefined,
        availabilityDate: formattedAvailabilityDate, // Required field, formatted as YYYY-MM-DD
        location: data.location,
        visaStatus: data.visaStatus,
        visaExpiry: cleanDate(data.visaExpiry), // Optional field, clean empty strings
        visaProfession: data.visaProfession || undefined,
        termsAccepted: data.termsAccepted,
      },
    })

    // IMPORTANT: Log the user in after registration
    // This ensures they're authenticated and can access their own dashboard
    try {
      const loginResult = await payload.login({
        collection: 'candidates',
        data: {
          email: data.email,
          password: data.password,
        },
      })

      if (loginResult.token) {
        const { cookies } = await import('next/headers')
        const cookieStore = await cookies()
        
        // Set auth cookie
        cookieStore.set('payload-token', loginResult.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        })
      }
    } catch (loginError) {
      console.error('Error logging in after registration:', loginError)
      // Don't fail registration if login fails, but log it
      // User can still log in manually
    }

    revalidatePath('/register')

    return {
      success: true,
      candidateId: String(candidate.id),
    }
  } catch (error: any) {
    console.error('Error registering candidate:', error)

    // Handle specific Payload errors
    if (error?.message?.includes('email')) {
      return {
        success: false,
        error: 'An account with this email already exists',
      }
    }

    return {
      success: false,
      error: error?.message || 'Failed to register candidate',
    }
  }
}

/**
 * Get the current candidate profile
 * SECURITY: Only returns the candidate profile for the currently authenticated user
 * Since Candidates has auth: true, we need to check both Users and Candidates collections
 */
export async function getCurrentCandidate(): Promise<Candidate | null> {
  try {
    const payload = await getPayload({ config })
    const headersList = await headers()
    
    // Get authenticated user (could be from Users or Candidates collection)
    const { user } = await payload.auth({ headers: headersList })

    if (!user) {
      console.warn('getCurrentCandidate: No authenticated user found')
      return null
    }

    // SECURITY: First, try to find candidate by ID (if user is from Candidates collection)
    // This ensures we only return the candidate that matches the authenticated user's ID
    try {
      const candidate = await payload.findByID({
        collection: 'candidates',
        id: user.id,
        depth: 1,
      })

      // SECURITY CHECK: Verify the candidate's email matches the authenticated user's email
      if (candidate.email !== user.email) {
        console.error('SECURITY WARNING: Candidate email mismatch!', {
          candidateEmail: candidate.email,
          userEmail: user.email,
          candidateId: candidate.id,
          userId: user.id,
        })
        return null
      }

      return candidate as Candidate
    } catch (error) {
      // Not found by ID, continue to email search
      console.warn('Candidate not found by ID, trying email search:', user.id)
    }

    // Fallback: Search by email (works for both Users and Candidates)
    // SECURITY: This should only be used if the user is from Users collection
    // and we need to find their candidate profile
    try {
      const candidates = await payload.find({
        collection: 'candidates',
        where: {
          email: {
            equals: user.email,
          },
        },
        limit: 1,
        depth: 1,
      })

      if (candidates.docs.length > 0) {
        const candidate = candidates.docs[0] as Candidate
        
        // SECURITY CHECK: Double-check email matches
        if (candidate.email !== user.email) {
          console.error('SECURITY WARNING: Candidate email mismatch in fallback!', {
            candidateEmail: candidate.email,
            userEmail: user.email,
          })
          return null
        }

        return candidate
      }
    } catch (searchError) {
      console.error('Error searching for candidate by email:', searchError)
    }

    return null
  } catch (error) {
    console.error('Error getting candidate:', error)
    return null
  }
}

/**
 * Update candidate profile
 */
export async function updateCandidate(
  candidateId: string | number,
  data: Partial<RegisterCandidateData>,
): Promise<{ success: boolean; error?: string; candidate?: Candidate }> {
  try {
    const payload = await getPayload({ config })
    const headersList = await headers()
    const { user } = await payload.auth({ headers: headersList })

    if (!user) {
      return {
        success: false,
        error: 'Not authenticated',
      }
    }

    // Prepare update data
    const updateData: any = {}
    if (data.firstName !== undefined) updateData.firstName = data.firstName
    if (data.lastName !== undefined) updateData.lastName = data.lastName
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.whatsapp !== undefined) updateData.whatsapp = data.whatsapp
    if (data.primarySkill !== undefined)
      updateData.primarySkill = parseInt(data.primarySkill, 10)
    if (data.gender !== undefined) updateData.gender = data.gender
    if (data.dob !== undefined) {
      // Format DOB to YYYY-MM-DD
      const dobDate = new Date(data.dob)
      if (!isNaN(dobDate.getTime())) {
        updateData.dob = dobDate.toISOString().split('T')[0]
      } else {
        updateData.dob = data.dob
      }
    }
    if (data.nationality !== undefined) updateData.nationality = data.nationality
    if (data.languages !== undefined) updateData.languages = data.languages
    if (data.jobTitle !== undefined) updateData.jobTitle = data.jobTitle
    if (data.experienceYears !== undefined) updateData.experienceYears = data.experienceYears
    if (data.saudiExperience !== undefined) updateData.saudiExperience = data.saudiExperience
    if (data.currentEmployer !== undefined) updateData.currentEmployer = data.currentEmployer
    if (data.availabilityDate !== undefined) {
      // Format availability date to YYYY-MM-DD
      const availDate = new Date(data.availabilityDate)
      if (!isNaN(availDate.getTime())) {
        updateData.availabilityDate = availDate.toISOString().split('T')[0]
      } else {
        updateData.availabilityDate = data.availabilityDate
      }
    }
    if (data.location !== undefined) updateData.location = data.location
    if (data.visaStatus !== undefined) updateData.visaStatus = data.visaStatus
    if (data.visaExpiry !== undefined) {
      // Format visa expiry date to YYYY-MM-DD or undefined if empty
      const visaExpiry = cleanDate(data.visaExpiry)
      if (visaExpiry) {
        const visaDate = new Date(visaExpiry)
        if (!isNaN(visaDate.getTime())) {
          updateData.visaExpiry = visaDate.toISOString().split('T')[0]
        } else {
          updateData.visaExpiry = visaExpiry
        }
      } else {
        updateData.visaExpiry = undefined
      }
    }
    if (data.visaProfession !== undefined) updateData.visaProfession = data.visaProfession
    if ((data as any).profilePicture !== undefined) updateData.profilePicture = (data as any).profilePicture
    if ((data as any).resume !== undefined) updateData.resume = (data as any).resume

    const candidate = await payload.update({
      collection: 'candidates',
      id: typeof candidateId === 'string' ? parseInt(candidateId, 10) : candidateId,
      data: updateData,
    })

    revalidatePath('/dashboard')

    return {
      success: true,
      candidate: candidate as Candidate,
    }
  } catch (error: any) {
    console.error('Error updating candidate:', error)
    return {
      success: false,
      error: error?.message || 'Failed to update candidate',
    }
  }
}

