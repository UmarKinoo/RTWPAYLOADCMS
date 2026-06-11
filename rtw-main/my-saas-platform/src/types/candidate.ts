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

export type CandidateEducationEntry = {
  degree: string
  institution: string
  fieldOfStudy?: string | null
  graduationYear?: number | null
  description?: string | null
}

export interface CandidateDetail extends CandidateListItem {
  phone: string
  whatsapp: string | null
  gender: 'male' | 'female'
  dob: string
  languages: string
  aboutMe: string | null
  education: CandidateEducationEntry[]
  /** Full job-matrix path at signup: discipline, category, subcategory, skill (comma-separated, localized). */
  jobMatrixSelection: string | null
  currentEmployer: string | null
  availabilityDate: string
  visaStatus: 'active' | 'expired' | 'nearly_expired' | 'none'
  visaExpiry: string | null
  visaProfession: string | null
  resumeUrl: string | null
  createdAt: string
  updatedAt: string
}
