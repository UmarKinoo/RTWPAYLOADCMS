'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { randomBytes } from 'crypto'
import type { Candidate } from '@/payload-types'
import { normalizePhone } from '@/server/sms/taqnyat'
import { sendEmail, verificationEmailTemplate } from './email'

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

    // Normalize phone number
    let normalizedPhone: string
    try {
      normalizedPhone = normalizePhone(data.phone)
    } catch (e: any) {
      return {
        success: false,
        error: e.message || 'Invalid phone number format',
      }
    }

    // Normalize WhatsApp if provided
    let normalizedWhatsApp: string | undefined
    if (data.whatsapp && data.whatsapp !== data.phone) {
      try {
        normalizedWhatsApp = normalizePhone(data.whatsapp)
      } catch (e: any) {
        return {
          success: false,
          error: e.message || 'Invalid WhatsApp number format',
        }
      }
    }

    // Generate email verification token
    const verificationToken = randomBytes(32).toString('hex')
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create candidate (this will also create auth user)
    const candidate = await payload.create({
      collection: 'candidates',
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email.toLowerCase().trim(),
        password: data.password,
        phone: normalizedPhone,
        whatsapp: normalizedWhatsApp || normalizedPhone, // Use phone if whatsapp not provided
        phoneVerified: false, // Will be set to true after OTP verification
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires.toISOString(),
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

    // Send verification email
    const emailResult = await sendEmail({
      to: data.email.toLowerCase().trim(),
      subject: 'Verify your email address - Ready to Work',
      html: verificationEmailTemplate(data.email.toLowerCase().trim(), verificationToken, 'candidate'),
    })

    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error)
      // Don't fail registration if email fails, but log it
      // User can request resend later
    }

    // Note: We don't log in automatically after registration
    // User will be logged in after OTP verification in the frontend
    // This ensures phone verification is completed before access

    revalidatePath('/register', 'page')

    return {
      success: true,
      candidateId: String(candidate.id),
    }
  } catch (error: any) {
    // SECURITY: Never log passwords or sensitive data
    const errorMessage = error?.message || 'Unknown error'
    console.error('Error registering candidate:', errorMessage)

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

    // SECURITY: Check user's collection first - only search by ID if user is from candidates collection
    // IDs are not unique across collections (ID 3 in candidates ≠ ID 3 in employers)
    const userCollection = (user as any).collection
    
    if (userCollection === 'candidates') {
      // User is from candidates collection - safe to search by ID
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
    } else {
      // User is from employers or users collection - skip ID search, go straight to email search
      // This prevents false matches when IDs happen to be the same across collections
      console.log(`User is from ${userCollection} collection, searching candidate by email only`)
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
      const cleanDate = (dateString: string | undefined): string | undefined => {
        if (!dateString || dateString.trim() === '') {
          return undefined
        }
        const date = new Date(dateString)
        if (isNaN(date.getTime())) {
          return undefined
        }
        return date.toISOString().split('T')[0]
      }
      const visaExpiry = cleanDate(data.visaExpiry)
      if (visaExpiry) {
        updateData.visaExpiry = visaExpiry
      } else {
        updateData.visaExpiry = undefined
      }
    }
    if (data.visaProfession !== undefined) updateData.visaProfession = data.visaProfession
    if ((data as any).profilePicture !== undefined) updateData.profilePicture = (data as any).profilePicture
    if ((data as any).resume !== undefined) updateData.resume = (data as any).resume
    if ((data as any).aboutMe !== undefined) updateData.aboutMe = (data as any).aboutMe
    if ((data as any).education !== undefined) updateData.education = (data as any).education
    if ((data as any).jobPreferences !== undefined) updateData.jobPreferences = (data as any).jobPreferences
    if ((data as any).preferredBenefits !== undefined) updateData.preferredBenefits = (data as any).preferredBenefits

    const candidate = await payload.update({
      collection: 'candidates',
      id: typeof candidateId === 'string' ? parseInt(candidateId, 10) : candidateId,
      data: updateData,
    })

    revalidatePath('/dashboard', 'page')

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

