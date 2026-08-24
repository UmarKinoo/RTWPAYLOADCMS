/**
 * QA accounts for Aziz / client UAT — candidate (incomplete profile) + employer (no plan).
 *
 * Usage: pnpm seed:aziz-qa
 *
 * Login password for both: set AZIZ_QA_PASSWORD env or see docs/reports/Client_Update_Aziz_2026-08-24.md
 */
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../..')
dotenv.config({ path: path.join(root, '.env') })

export const AZIZ_QA_PASSWORD = process.env.AZIZ_QA_PASSWORD?.trim() || 'RtwAzizUAT-Aug2026!'
export const AZIZ_QA_CANDIDATE_EMAIL = 'aziz.qa.candidate@readybot-qa.example.test'
export const AZIZ_QA_EMPLOYER_EMAIL = 'aziz.qa.employer@readybot-qa.example.test'

async function deleteByEmail(
  payload: Awaited<ReturnType<typeof import('payload').getPayload>>,
  collection: 'candidates' | 'employers',
  email: string,
) {
  const existing = await payload.find({
    collection,
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  })
  if (existing.docs[0]) {
    await payload.delete({ collection, id: existing.docs[0].id, overrideAccess: true })
    console.log(`  Deleted existing ${collection}: ${email}`)
  }
}

async function main() {
  if (!process.env.PAYLOAD_SECRET) throw new Error('PAYLOAD_SECRET missing')
  if (!(process.env.DATABASE_URI || process.env.DATABASE_URL)) {
    throw new Error('DATABASE_URI or DATABASE_URL missing')
  }

  const { getPayload } = await import('payload')
  const { default: config } = await import('@payload-config')
  const payload = await getPayload({ config })

  const skills = await payload.find({ collection: 'skills', limit: 1, overrideAccess: true })
  const skill = skills.docs[0]
  if (!skill) throw new Error('No skills in DB — run pnpm seed:skills first')

  const ctx = { disableRevalidate: true as const, skipVectorUpdate: true as const }

  console.log('\nSeeding Aziz QA accounts…\n')

  await deleteByEmail(payload, 'candidates', AZIZ_QA_CANDIDATE_EMAIL)
  const availability = new Date()
  availability.setMonth(availability.getMonth() + 1)

  const candidate = await payload.create({
    collection: 'candidates',
    overrideAccess: true,
    context: ctx,
    data: {
      email: AZIZ_QA_CANDIDATE_EMAIL,
      password: AZIZ_QA_PASSWORD,
      firstName: 'Aziz',
      lastName: 'Candidate',
      phone: '+966591009999',
      phoneVerified: true,
      emailVerified: true,
      termsAccepted: true,
      primarySkill: skill.id,
      gender: 'male',
      dob: '1990-01-01',
      nationality: 'Saudi Arabia',
      languages: 'Arabic, English',
      jobTitle: 'General Worker',
      experienceYears: 3,
      saudiExperience: 2,
      availabilityDate: availability.toISOString(),
      location: 'Riyadh',
      visaStatus: 'active',
      // Left empty on purpose for profile strength demo:
      // profilePicture, resume, aboutMe, education, jobPreferences, preferredBenefits
    } as never,
  })

  await deleteByEmail(payload, 'employers', AZIZ_QA_EMPLOYER_EMAIL)
  let employerId: number | string | undefined
  try {
    const employer = await payload.create({
      collection: 'employers',
      overrideAccess: true,
      context: ctx,
      data: {
        email: AZIZ_QA_EMPLOYER_EMAIL,
        password: AZIZ_QA_PASSWORD,
        responsiblePerson: 'Aziz Test',
        companyName: 'Aziz Test Company',
        phoneVerified: true,
        emailVerified: true,
        termsAccepted: true,
      } as never,
    })
    employerId = employer.id
  } catch (err) {
    console.warn('  ⚠ Could not seed employer (create manually or register on site):', err)
  }

  console.log('✓ Candidate (profile strength + job role picker)')
  console.log('    Email:   ', AZIZ_QA_CANDIDATE_EMAIL)
  console.log('    Password:', AZIZ_QA_PASSWORD)
  console.log('    ID:      ', candidate.id)
  console.log('')
  if (employerId) {
    console.log('✓ Employer (pricing plans — no active plan yet)')
    console.log('    Email:   ', AZIZ_QA_EMPLOYER_EMAIL)
    console.log('    Password:', AZIZ_QA_PASSWORD)
    console.log('    ID:      ', employerId)
  } else {
    console.log('⚠ Employer not seeded — register at /en/register?collection=employers')
    console.log('    Suggested email:', AZIZ_QA_EMPLOYER_EMAIL)
    console.log('    Suggested password:', AZIZ_QA_PASSWORD)
  }
  console.log('')
  console.log('Login: /en/login')
  console.log('Candidate dashboard: /en/dashboard')
  console.log('Pricing: /en/pricing')
  console.log('')
}

main().catch((e) => {
  console.error('seed-aziz-qa-accounts: FAILED', e)
  process.exit(1)
})
