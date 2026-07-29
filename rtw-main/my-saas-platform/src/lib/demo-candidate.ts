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

  // ESCO flow context
  sessionId: string
  /** Preferred label of the first saved occupation — becomes the job title. */
  jobTitle: string
  /** Merged universal qualification answers (experience, visa, availability). */
  answers: UniversalAnswerMap

  termsAccepted: boolean
}

/**
 * Resolve a ReadyToWork skills-tree primarySkill from the ESCO occupation label.
 * Candidates.primarySkill is required; the demo no longer asks for a separate
 * "job role" step because the occupation was already confirmed.
 */
async function resolvePrimarySkillId(jobTitle: string): Promise<string | null> {
  const payload = await getPayload({ config })
  const title = jobTitle.trim()
  if (!title) return null

  const tryFind = async (term: string) => {
    const result = await payload.find({
      collection: 'skills',
      where: {
        or: [
          { name: { contains: term } },
          { name_en: { contains: term } },
          { name_ar: { contains: term } },
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    return result.docs[0] ? String(result.docs[0].id) : null
  }

  const exact = await tryFind(title)
  if (exact) return exact

  // Try first two significant words (e.g. "air conditioning" from a longer label)
  const words = title.split(/\s+/).filter((w) => w.length > 2)
  if (words.length >= 2) {
    const partial = await tryFind(words.slice(0, 2).join(' '))
    if (partial) return partial
  }
  if (words.length >= 1) {
    const one = await tryFind(words[0])
    if (one) return one
  }

  // Last resort so registration can complete — moderators / ReadyBot can fix.
  const any = await payload.find({
    collection: 'skills',
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (any.docs[0]) {
    console.warn(
      `[registerDemoCandidate] No skill match for "${title}"; falling back to skill id ${any.docs[0].id}`,
    )
    return String(any.docs[0].id)
  }
  return null
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

  const primarySkill = await resolvePrimarySkillId(input.jobTitle)
  if (!primarySkill) {
    return {
      success: false,
      error: 'Could not match a job role for your occupation. Please contact support.',
    }
  }

  const result = await registerCandidate({
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    password: input.password,
    phone: input.phone,
    whatsapp: input.whatsapp,
    primarySkill,
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
