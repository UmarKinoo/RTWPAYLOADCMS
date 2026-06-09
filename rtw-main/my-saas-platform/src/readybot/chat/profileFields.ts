import type { Payload } from 'payload'
import type { Candidate, Media, Skill } from '@/payload-types'
import { candidateLabelFromDoc } from '@/lib/readybot/dashboard-helpers'
import { normalizeFieldKey } from '@/readybot/tools/permissionTool'
import { normalizeRelationshipId } from '@/readybot/tools/payloadTool'

/** Fields ops chat may propose (admin must approve before write). */
export const CHAT_PROFILE_FIELD_KEYS = new Set([
  'jobTitle',
  'primarySkill',
  'location',
  'experienceYears',
  'aboutMe',
  'whatsapp',
  'nationality',
  'languages',
  'visaStatus',
  'visaExpiry',
  'visaProfession',
  'readyBot.whatsappNumber',
  'readyBot.preferredContactChannel',
  'jobPreferences.preferredSalary',
  'jobPreferences.preferredLocation',
])

const CHAT_FIELD_ALIASES: Record<string, string> = {
  readyBotWhatsappNumber: 'readyBot.whatsappNumber',
  preferredContactChannel: 'readyBot.preferredContactChannel',
  preferredSalary: 'jobPreferences.preferredSalary',
  preferredLocation: 'jobPreferences.preferredLocation',
  mainSkill: 'primarySkill',
  yearsOfExperience: 'experienceYears',
  currentCity: 'location',
}

export type ResolvedProfileFields = {
  fields: Record<string, unknown>
  preview: Record<string, unknown>
  blocked: string[]
}

export async function resolvePrimarySkillId(
  payload: Payload,
  value: string | number,
): Promise<{ id: number } | { error: string }> {
  const numeric = normalizeRelationshipId(value)
  if (numeric !== undefined) return { id: numeric }

  const trimmed = String(value).trim()
  if (!trimmed) return { error: 'primarySkill value is empty' }

  const exact = await payload.find({
    collection: 'skills',
    where: { name: { equals: trimmed } },
    limit: 1,
    overrideAccess: true,
  })
  if (exact.docs[0]) {
    return { id: exact.docs[0].id as number }
  }

  const fuzzy = await payload.find({
    collection: 'skills',
    where: { name: { contains: trimmed } },
    limit: 5,
    overrideAccess: true,
  })
  if (fuzzy.docs.length === 1) {
    return { id: fuzzy.docs[0].id as number }
  }
  if (fuzzy.docs.length > 1) {
    const names = fuzzy.docs.map((d) => (d as Skill).name).join(', ')
    return {
      error: `Multiple skills match "${trimmed}": ${names}. Use skill ID or exact skill name.`,
    }
  }
  return { error: `No skill found for "${trimmed}"` }
}

export async function normalizeChatProfileFields(
  payload: Payload,
  rawFields: Record<string, unknown>,
): Promise<ResolvedProfileFields | { error: string }> {
  const fields: Record<string, unknown> = {}
  const preview: Record<string, unknown> = {}
  const blocked: string[] = []

  for (const [rawKey, value] of Object.entries(rawFields)) {
    if (value === undefined || value === null || value === '') continue
    const key = CHAT_FIELD_ALIASES[rawKey] ?? normalizeFieldKey(rawKey)
    if (!CHAT_PROFILE_FIELD_KEYS.has(key)) {
      blocked.push(key)
      continue
    }
    if (key === 'primarySkill') {
      const resolved = await resolvePrimarySkillId(payload, value as string | number)
      if ('error' in resolved) return { error: resolved.error }
      fields.primarySkill = resolved.id
      preview.primarySkill = resolved.id
      const skill = await payload.findByID({
        collection: 'skills',
        id: resolved.id,
        depth: 0,
        overrideAccess: true,
      })
      preview.primarySkillName = (skill as Skill).name
      continue
    }
    fields[key] = value
    preview[key] = value
  }

  if (blocked.length > 0) {
    return {
      error: `Fields not allowed from chat: ${blocked.join(', ')}. Allowed: ${[...CHAT_PROFILE_FIELD_KEYS].join(', ')}`,
    }
  }
  if (Object.keys(fields).length === 0) {
    return { error: 'No profile fields to update' }
  }

  return { fields, preview, blocked }
}

export function summarizeCandidateProfile(doc: Candidate, dashboardUrl: string) {
  const skill =
    typeof doc.primarySkill === 'object' && doc.primarySkill
      ? { id: doc.primarySkill.id, name: doc.primarySkill.name }
      : doc.primarySkill
        ? { id: doc.primarySkill, name: null }
        : null

  const firstName = doc.firstName?.trim() || null
  const lastName = doc.lastName?.trim() || null
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || null

  const resume =
    doc.resume && typeof doc.resume === 'object' ? (doc.resume as Media) : null

  const missingFields = Array.isArray(doc.readyBot?.missingFields)
    ? doc.readyBot.missingFields.map((m) =>
        typeof m === 'object' && m && 'field' in m ? String(m.field) : String(m),
      )
    : []

  return {
    id: doc.id,
    label: candidateLabelFromDoc(doc),
    firstName,
    lastName,
    fullName,
    email: doc.email ?? null,
    phone: doc.phone ?? null,
    jobTitle: doc.jobTitle ?? null,
    primarySkill: skill,
    location: doc.location ?? null,
    experienceYears: doc.experienceYears ?? null,
    aboutMe: doc.aboutMe
      ? String(doc.aboutMe).length > 200
        ? `${String(doc.aboutMe).slice(0, 200)}…`
        : String(doc.aboutMe)
      : null,
    whatsapp: doc.whatsapp ?? null,
    nationality: doc.nationality ?? null,
    languages: doc.languages ?? null,
    visaStatus: doc.visaStatus ?? null,
    visaExpiry: doc.visaExpiry ?? null,
    visaProfession: doc.visaProfession ?? null,
    currentEmployer: doc.currentEmployer ?? null,
    availabilityDate: doc.availabilityDate ?? null,
    gender: doc.gender ?? null,
    hasResume: Boolean(resume?.url),
    resumeUrl: resume?.url ?? null,
    educationCount: Array.isArray(doc.education) ? doc.education.length : 0,
    readyBot: {
      enabled: doc.readyBot?.readyBotEnabled ?? null,
      screeningStatus: doc.readyBot?.screeningStatus ?? null,
      whatsappNumber: doc.readyBot?.whatsappNumber ?? null,
      whatsappOptIn: doc.readyBot?.whatsappOptIn ?? null,
      preferredContactChannel: doc.readyBot?.preferredContactChannel ?? null,
      missingFields,
      lastScreenedAt: doc.readyBot?.lastScreenedAt ?? null,
    },
    screeningStatus: doc.readyBot?.screeningStatus ?? null,
    dashboardUrl,
  }
}
