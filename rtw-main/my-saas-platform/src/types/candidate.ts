/**
 * Shared candidate types for use in both server and client.
 * Kept separate from @/lib/payload/candidates so client components can import
 * without pulling in Payload/config (Node built-ins like dns, etc.).
 */
import type { BillingClass } from '@/lib/billing'

export interface CandidateListItem {
  id: number
  firstName: string
  lastName: string
  jobTitle: string
  location: string
  nationality: string
  experienceYears: number
  saudiExperience: number
  profilePictureUrl: string | null
  billingClass: BillingClass | null
  email?: string
}

export interface CandidateDetail extends CandidateListItem {
  phone: string
  whatsapp: string | null
  gender: 'male' | 'female'
  dob: string
  languages: string
  currentEmployer: string | null
  availabilityDate: string
  visaStatus: 'active' | 'expired' | 'nearly_expired' | 'none'
  visaExpiry: string | null
  visaProfession: string | null
  resumeUrl: string | null
  createdAt: string
  updatedAt: string
}
