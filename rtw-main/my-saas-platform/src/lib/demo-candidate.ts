'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { registerCandidate, type RegisterCandidateResponse } from '@/lib/candidate'
import {
  mapUniversalAnswers,
  type UniversalAnswerMap,
} from '@/lib/esco/qualification/mapToCandidate'

export interface RegisterDemoCandidateInput {
  // Account + personal steps (collected by the demo wizard form)
  firstName: string
  lastName: string
  email: string
  password: string
  phone: string
  whatsapp?: string
  gender: 'male' | 'female'
  dob: string
  nationality: string
  languages: string
  location: string
  primarySkill: string
  secondarySkill?: string
  tertiarySkill?: string

  // ESCO flow context
  sessionId: string
  /** Preferred label of the first saved occupation — becomes the job title. */
  jobTitle: string
  /** Merged universal qualification answers (experience, visa, availability). */
  answers: UniversalAnswerMap

  termsAccepted: boolean
}

/**
 * Creates the real candidates record from the demo-cand-reg flow, then claims
 * every candidate-occupation saved under the anonymous session id so the ESCO
 * occupations, skills, and qualification answers belong to the new candidate.
 */
export async function registerDemoCandidate(
  input: RegisterDemoCandidateInput,
): Promise<RegisterCandidateResponse> {
  const mapped = mapUniversalAnswers(input.answers ?? {})

  const result = await registerCandidate({
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    password: input.password,
    phone: input.phone,
    whatsapp: input.whatsapp,
    primarySkill: input.primarySkill,
    secondarySkill: input.secondarySkill,
    tertiarySkill: input.tertiarySkill,
    gender: input.gender,
    dob: input.dob,
    nationality: input.nationality,
    languages: input.languages,
    jobTitle: input.jobTitle,
    experienceYears: mapped.experienceYears,
    saudiExperience: mapped.saudiExperience,
    currentEmployer: mapped.currentEmployer,
    availabilityDate: mapped.availabilityDate,
    location: input.location,
    visaStatus: mapped.visaStatus,
    visaExpiry: mapped.visaExpiry,
    visaProfession: mapped.visaProfession,
    termsAccepted: input.termsAccepted,
  })

  if (!result.success || !result.candidateId) return result

  // Claim the anonymous session's occupations (skills and qualification
  // answers stay linked through candidate-occupations). Never fail the
  // registration itself if claiming hits an issue — the account exists.
  if (input.sessionId) {
    try {
      const payload = await getPayload({ config })
      await payload.update({
        collection: 'candidate-occupations',
        where: { sessionId: { equals: input.sessionId } },
        data: { candidate: parseInt(result.candidateId, 10) },
        overrideAccess: true,
      })
    } catch (error) {
      console.error(
        '[registerDemoCandidate] Failed to link session occupations to candidate:',
        error instanceof Error ? error.message : error,
      )
    }
  }

  return result
}
