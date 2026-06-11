/**
 * Creates a single test candidate account (Payload API — same path as registration).
 *
 * Env (optional):
 *   TEST_CANDIDATE_EMAIL    — default: rtw-test-<timestamp>@example.test
 *   TEST_CANDIDATE_PHONE    — default: random +9665xxxxxxxx (unique)
 *   TEST_CANDIDATE_PASSWORD — default: RtwTestCandidate2026!
 *
 * Usage: pnpm create:test-candidate
 */
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../..')
dotenv.config({ path: path.join(root, '.env') })

function randomSaMobile(): string {
  const n = Math.floor(10000000 + Math.random() * 89999999)
  return `+9665${String(n)}`
}

async function main(): Promise<void> {
  if (!process.env.PAYLOAD_SECRET) {
    throw new Error('PAYLOAD_SECRET is not set in .env')
  }
  if (!(process.env.DATABASE_URI || process.env.DATABASE_URL)) {
    throw new Error('DATABASE_URI or DATABASE_URL must be set in .env')
  }

  const ts = Date.now()
  const email =
    process.env.TEST_CANDIDATE_EMAIL?.trim() || `rtw-test-${ts}@example.test`
  const phone = process.env.TEST_CANDIDATE_PHONE?.trim() || randomSaMobile()
  const password =
    process.env.TEST_CANDIDATE_PASSWORD?.trim() || 'RtwTestCandidate2026!'

  const { getPayload } = await import('payload')
  const { default: config } = await import('@payload-config')

  const payload = await getPayload({ config })

  const skills = await payload.find({
    collection: 'skills',
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const skill = skills.docs[0]
  if (!skill) {
    throw new Error('No skills in database; seed skills first (e.g. pnpm seed:skills).')
  }

  const availability = new Date()
  availability.setMonth(availability.getMonth() + 1)

  const ctx = { disableRevalidate: true as const, skipVectorUpdate: true as const }

  const doc = await payload.create({
    collection: 'candidates',
    data: {
      email,
      password,
      firstName: 'Test',
      lastName: 'Candidate',
      phone,
      whatsapp: phone,
      phoneVerified: true,
      emailVerified: true,
      primarySkill: skill.id,
      gender: 'male',
      dob: '1992-06-15',
      nationality: 'Saudi Arabia',
      languages: 'Arabic, English',
      jobTitle: 'General Technician',
      experienceYears: 5,
      saudiExperience: 5,
      currentEmployer: 'RTW Test Employer',
      availabilityDate: availability.toISOString(),
      location: 'Riyadh',
      visaStatus: 'active',
      termsAccepted: true,
      profileStatus: 'approved',
    },
    overrideAccess: true,
    context: ctx,
  })

  console.log('')
  console.log('Created test candidate')
  console.log('  id:       ', doc.id)
  console.log('  email:    ', email)
  console.log('  password: ', password)
  console.log('  phone:    ', phone)
  console.log('  skill id: ', skill.id, `(${skill.name})`)
  console.log('')
}

main().catch((e) => {
  console.error('create-test-candidate: FAILED', e)
  process.exit(1)
})
