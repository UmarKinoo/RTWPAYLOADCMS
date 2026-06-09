import type { Candidate, Media } from '@/payload-types'
import { getReadyBotFields, resolveWhatsAppNumber } from '../lib/candidateReadyBot'

export function buildCandidateProfileContext(candidate: Candidate): Record<string, unknown> {
  const rb = getReadyBotFields(candidate)
  const resume =
    candidate.resume && typeof candidate.resume === 'object'
      ? (candidate.resume as Media)
      : null
  return {
    id: candidate.id,
    email: candidate.email,
    firstName: candidate.firstName,
    lastName: candidate.lastName,
    phone: candidate.phone,
    whatsapp: resolveWhatsAppNumber(candidate),
    jobTitle: candidate.jobTitle,
    experienceYears: candidate.experienceYears,
    location: candidate.location,
    nationality: candidate.nationality,
    visaStatus: candidate.visaStatus,
    availabilityDate: candidate.availabilityDate,
    primarySkill:
      typeof candidate.primarySkill === 'object' ? candidate.primarySkill?.name : candidate.primarySkill,
    aboutMe: candidate.aboutMe,
    resumeUrl: resume?.url,
    screeningStatus: rb.screeningStatus,
  }
}

export function getResumeMediaUrl(candidate: Candidate): string | null {
  if (!candidate.resume || typeof candidate.resume !== 'object') return null
  return (candidate.resume as Media).url ?? null
}
