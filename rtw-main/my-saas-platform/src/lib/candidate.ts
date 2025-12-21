'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'

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
        dob: data.dob,
        nationality: data.nationality,
        languages: data.languages,
        jobTitle: data.jobTitle,
        experienceYears: data.experienceYears,
        saudiExperience: data.saudiExperience,
        currentEmployer: data.currentEmployer,
        availabilityDate: data.availabilityDate,
        location: data.location,
        visaStatus: data.visaStatus,
        visaExpiry: data.visaExpiry,
        visaProfession: data.visaProfession,
        termsAccepted: data.termsAccepted,
      },
    })

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

