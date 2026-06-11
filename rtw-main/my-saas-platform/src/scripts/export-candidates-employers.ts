/**
 * Export all candidates and employers to CSV files.
 *
 * Usage (local):
 *   pnpm run export:candidates-employers
 *
 * Usage (production — pass DB URL in terminal, do not commit credentials):
 *   DATABASE_URI="postgresql://..." pnpm run export:candidates-employers
 *   PRODUCTION_DATABASE_URI="postgresql://..." pnpm run export:candidates-employers
 *
 * Output: exports/candidates-YYYY-MM-DD.csv and exports/employers-YYYY-MM-DD.csv
 */
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { getPayload } from 'payload'
import type { Candidate, Employer, Media, Plan, Skill } from '@/payload-types'

const envPath = path.resolve(process.cwd(), '.env')
const terminalDbUri =
  process.env.DATABASE_URI ||
  process.env.PRODUCTION_DATABASE_URI ||
  process.env.PROD_DATABASE_URI ||
  process.env.PROD_DB_URI

dotenv.config({ path: envPath })

if (terminalDbUri) {
  process.env.DATABASE_URI = terminalDbUri
}

if (!process.env.PAYLOAD_SECRET) {
  console.error('❌ PAYLOAD_SECRET is not set')
  process.exit(1)
}

const dbUri = process.env.DATABASE_URI || process.env.DATABASE_URL
if (!dbUri) {
  console.error('❌ Set DATABASE_URI or PRODUCTION_DATABASE_URI for the target database')
  process.exit(1)
}

// Read-only against prod: avoid schema push
process.env.PAYLOAD_DISABLE_PUSH = '1'

function isProdDb(uri: string): boolean {
  return (
    !uri.includes('localhost') &&
    !uri.includes('127.0.0.1') &&
    !uri.includes('54322')
  )
}

function maskUri(uri: string): string {
  return uri.replace(/(:\/\/[^:]+:)([^@]+)(@)/, '$1****$3')
}

function formatDate(value: unknown): string {
  if (value == null || value === '') return ''
  const d = new Date(String(value))
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toISOString().slice(0, 10)
}

function mediaUrl(media: number | Media | null | undefined): string {
  if (!media || typeof media === 'number') return ''
  return media.url || ''
}

function mediaFilename(media: number | Media | null | undefined): string {
  if (!media || typeof media === 'number') return ''
  return media.filename || ''
}

function skillName(skill: number | Skill | null | undefined): string {
  if (!skill) return ''
  if (typeof skill === 'number') return String(skill)
  return skill.name || ''
}

function planName(plan: number | Plan | null | undefined): string {
  if (!plan) return ''
  if (typeof plan === 'number') return String(plan)
  return plan.name || ''
}

function joinList(items: unknown, formatter: (item: unknown) => string): string {
  if (!Array.isArray(items) || items.length === 0) return ''
  return items.map(formatter).filter(Boolean).join('; ')
}

function flattenCandidate(c: Candidate): Record<string, string | number | boolean> {
  const rb = c.readyBot
  return {
    id: c.id,
    email: c.email,
    firstName: c.firstName,
    lastName: c.lastName,
    phone: c.phone,
    phoneVerified: c.phoneVerified ?? false,
    whatsapp: c.whatsapp ?? '',
    primarySkill: skillName(c.primarySkill),
    billingClass: c.billingClass ?? '',
    gender: c.gender,
    dob: formatDate(c.dob),
    nationality: c.nationality,
    languages: c.languages,
    jobTitle: c.jobTitle,
    experienceYears: c.experienceYears,
    saudiExperience: c.saudiExperience,
    currentEmployer: c.currentEmployer ?? '',
    availabilityDate: formatDate(c.availabilityDate),
    location: c.location,
    visaStatus: c.visaStatus,
    visaExpiry: formatDate(c.visaExpiry),
    visaProfession: c.visaProfession ?? '',
    emailVerified: c.emailVerified ?? false,
    aboutMe: c.aboutMe ?? '',
    profilePictureUrl: mediaUrl(c.profilePicture),
    profilePictureFilename: mediaFilename(c.profilePicture),
    resumeUrl: mediaUrl(c.resume),
    resumeFilename: mediaFilename(c.resume),
    education: joinList(c.education, (e) => {
      const ed = e as NonNullable<Candidate['education']>[number]
      return [ed.degree, ed.institution, ed.fieldOfStudy, ed.graduationYear]
        .filter((x) => x != null && x !== '')
        .join(' @ ')
    }),
    preferredJobTitle: c.jobPreferences?.preferredJobTitle ?? '',
    preferredLocation: c.jobPreferences?.preferredLocation ?? '',
    preferredSalary: c.jobPreferences?.preferredSalary ?? '',
    workType: c.jobPreferences?.workType ?? '',
    shiftPreference: c.jobPreferences?.shiftPreference ?? '',
    preferredBenefits: joinList(c.preferredBenefits, (b) => {
      const item = b as NonNullable<Candidate['preferredBenefits']>[number]
      return item.benefit === 'other' ? item.otherBenefit || 'other' : item.benefit
    }),
    profileStatus: (c as { profileStatus?: string }).profileStatus ?? 'pending_review',
    termsAccepted: c.termsAccepted,
    readyBotScreeningStatus: rb?.screeningStatus ?? '',
    readyBotMissingFields: joinList(rb?.missingFields, (f) => {
      const item = f as { field?: string }
      return item.field ?? ''
    }),
    readyBotWhatsappNumber: rb?.whatsappNumber ?? '',
    readyBotWhatsappOptIn: rb?.whatsappOptIn ?? false,
    readyBotWhatsappOptInAt: formatDate(rb?.whatsappOptInAt),
    readyBotPreferredContactChannel: rb?.preferredContactChannel ?? '',
    readyBotLastScreenedAt: formatDate(rb?.lastScreenedAt),
    readyBotLastContactedAt: formatDate(rb?.lastContactedAt),
    readyBotLastReplyAt: formatDate(rb?.lastReplyAt),
    readyBotScreeningSummary: rb?.screeningSummary ?? '',
    readyBotScreeningConfidence: rb?.screeningConfidence ?? '',
    lastLoginAt: formatDate(c.lastLoginAt),
    createdAt: formatDate(c.createdAt),
    updatedAt: formatDate(c.updatedAt),
  }
}

function flattenEmployer(e: Employer): Record<string, string | number | boolean> {
  return {
    id: e.id,
    email: e.email,
    companyName: e.companyName,
    responsiblePerson: e.responsiblePerson,
    phone: e.phone ?? '',
    phoneVerified: e.phoneVerified ?? false,
    website: e.website ?? '',
    address: e.address ?? '',
    industry: e.industry ?? '',
    companySize: e.companySize ?? '',
    termsAccepted: e.termsAccepted,
    emailVerified: e.emailVerified ?? false,
    interviewCredits: e.wallet?.interviewCredits ?? 0,
    contactUnlockCredits: e.wallet?.contactUnlockCredits ?? 0,
    activePlan: planName(e.activePlan),
    basicFilters: e.features?.basicFilters ?? false,
    nationalityRestriction: e.features?.nationalityRestriction ?? '',
    lastLoginAt: formatDate(e.lastLoginAt),
    createdAt: formatDate(e.createdAt),
    updatedAt: formatDate(e.updatedAt),
  }
}

function escapeCsvCell(value: unknown): string {
  if (value == null) return ''
  const str = String(value)
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function rowsToCsv(rows: Record<string, string | number | boolean>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escapeCsvCell(row[h])).join(',')),
  ]
  return lines.join('\n')
}

async function fetchAll<T>(
  payload: Awaited<ReturnType<typeof getPayload>>,
  collection: 'candidates' | 'employers',
): Promise<T[]> {
  const docs: T[] = []
  let page = 1
  const limit = 100

  while (true) {
    const result = await payload.find({
      collection,
      limit,
      page,
      depth: 2,
      pagination: true,
      overrideAccess: true,
    })
    docs.push(...(result.docs as T[]))
    if (!result.hasNextPage) break
    page += 1
  }

  return docs
}

async function main() {
  const prod = isProdDb(dbUri)
  console.log(`📤 Exporting candidates & employers`)
  console.log(`📡 Database: ${prod ? '☁️  PRODUCTION' : '🏠 LOCAL'} — ${maskUri(dbUri)}\n`)

  const config = await import('@payload-config')
  const payload = await getPayload({ config: config.default })

  console.log('⏳ Fetching candidates...')
  const candidates = await fetchAll<Candidate>(payload, 'candidates')
  console.log(`   Found ${candidates.length} candidates`)

  console.log('⏳ Fetching employers...')
  const employers = await fetchAll<Employer>(payload, 'employers')
  console.log(`   Found ${employers.length} employers`)

  const date = new Date().toISOString().slice(0, 10)
  const outDir = path.resolve(process.cwd(), 'exports')
  fs.mkdirSync(outDir, { recursive: true })

  const candidatesPath = path.join(outDir, `candidates-${date}.csv`)
  const employersPath = path.join(outDir, `employers-${date}.csv`)

  const candidateRows = candidates.map(flattenCandidate)
  const employerRows = employers.map(flattenEmployer)

  fs.writeFileSync(candidatesPath, rowsToCsv(candidateRows), 'utf8')
  fs.writeFileSync(employersPath, rowsToCsv(employerRows), 'utf8')

  console.log('\n✅ Export complete')
  console.log(`   ${candidatesPath}`)
  console.log(`   ${employersPath}`)
  console.log('\n🔒 Sensitive fields excluded: passwords, hashes, tokens, embeddings, sessions')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Export failed:', err)
    process.exit(1)
  })
