/**
 * Seeds 10 candidates with deliberate profile gaps / ReadyBot states for QA.
 *
 * Prerequisites: pnpm seed:skills (at least one skill in DB)
 *
 * Usage:
 *   pnpm seed:readybot-test-candidates
 *   pnpm readybot:scan
 *
 * Login: any candidate uses password ReadyBotTest2026!
 * Dashboard: /{locale}/readybot → Live tab
 */
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../..')
dotenv.config({ path: path.join(root, '.env') })

const PASSWORD = 'ReadyBotTest2026!'
const EMAIL_DOMAIN = 'readybot-qa.example.test'

type ReadyBotSeed = {
  slug: string
  firstName: string
  lastName: string
  phone: string
  scenario: string
  data: Record<string, unknown>
  readyBot: Record<string, unknown>
}

const availability = () => {
  const d = new Date()
  d.setMonth(d.getMonth() + 2)
  return d.toISOString()
}

const SEEDS: ReadyBotSeed[] = [
  {
    slug: '01-almost-complete',
    firstName: 'Ready',
    lastName: 'AlmostComplete',
    phone: '+966591000001',
    scenario: 'Missing CV + about me only; WhatsApp opt-in — ideal scan target',
    data: {
      jobTitle: 'HVAC Technician',
      experienceYears: 6,
      saudiExperience: 4,
      location: 'Riyadh',
      visaStatus: 'active',
      availabilityDate: availability(),
      nationality: 'Saudi Arabia',
      languages: 'Arabic, English',
      gender: 'male',
      dob: '1990-01-10',
      aboutMe: '',
      currentEmployer: 'CoolAir Services',
    },
    readyBot: {
      readyBotEnabled: true,
      screeningStatus: 'new',
      whatsappOptIn: true,
      whatsappOptInAt: new Date().toISOString(),
      preferredContactChannel: 'whatsapp',
      whatsappNumber: '+966591000001',
      missingFields: [
        { field: 'resume' },
        { field: 'aboutMe' },
      ],
    },
  },
  {
    slug: '02-no-whatsapp-optin',
    firstName: 'No',
    lastName: 'WhatsAppOptIn',
    phone: '+966591000002',
    scenario: 'Full profile but whatsappOptIn false → human review on outreach',
    data: {
      jobTitle: 'Electrician',
      experienceYears: 8,
      saudiExperience: 5,
      location: 'Jeddah',
      visaStatus: 'active',
      availabilityDate: availability(),
      nationality: 'Egyptian',
      languages: 'Arabic',
      gender: 'male',
      dob: '1988-05-20',
      aboutMe: 'Licensed electrician, industrial and residential.',
    },
    readyBot: {
      readyBotEnabled: true,
      screeningStatus: 'incomplete',
      whatsappOptIn: false,
      preferredContactChannel: 'whatsapp',
      whatsappNumber: '+966591000002',
    },
  },
  {
    slug: '03-opted-out',
    firstName: 'Opted',
    lastName: 'Out',
    phone: '+966591000003',
    scenario: 'screeningStatus opted_out — scan should skip',
    data: {
      jobTitle: 'Welder',
      experienceYears: 3,
      saudiExperience: 1,
      location: 'Dammam',
      visaStatus: 'active',
      availabilityDate: availability(),
      nationality: 'Pakistani',
      languages: 'Urdu, Arabic',
      gender: 'male',
      dob: '1995-03-15',
      aboutMe: 'Should never be contacted by ReadyBot.',
    },
    readyBot: {
      screeningStatus: 'opted_out',
      whatsappOptIn: false,
      whatsappNumber: '+966591000003',
    },
  },
  {
    slug: '04-sparse-profile',
    firstName: 'Sparse',
    lastName: 'Profile',
    phone: '+966591000004',
    scenario: 'Meets required fields but weak data: no CV/about me, job title TBD, 0 years exp',
    data: {
      gender: 'male',
      dob: '1993-07-01',
      nationality: 'Indian',
      languages: 'Hindi, English',
      saudiExperience: 0,
      jobTitle: 'TBD / General Worker',
      experienceYears: 0,
      location: 'Not specified yet',
      visaStatus: 'none',
      availabilityDate: availability(),
      aboutMe: '',
    },
    readyBot: {
      readyBotEnabled: true,
      screeningStatus: 'incomplete',
      whatsappOptIn: true,
      whatsappOptInAt: new Date().toISOString(),
      preferredContactChannel: 'whatsapp',
      whatsappNumber: '+966591000004',
      missingFields: [{ field: 'resume' }, { field: 'aboutMe' }],
    },
  },
  {
    slug: '05-phone-whatsapp-mismatch',
    firstName: 'Phone',
    lastName: 'Mismatch',
    phone: '+966591000005',
    scenario: 'Account phone ≠ readyBot.whatsappNumber (bot may target wrong number)',
    data: {
      jobTitle: 'Lab Technician',
      experienceYears: 4,
      saudiExperience: 2,
      location: 'Riyadh',
      visaStatus: 'active',
      availabilityDate: availability(),
      nationality: 'Saudi Arabia',
      gender: 'female',
      dob: '1994-11-30',
      languages: 'Arabic, English',
      aboutMe: 'Chemistry lab assistant.',
      whatsapp: '+966591000099',
    },
    readyBot: {
      readyBotEnabled: true,
      screeningStatus: 'incomplete',
      whatsappOptIn: true,
      preferredContactChannel: 'whatsapp',
      whatsappNumber: '+966591000088',
      missingFields: [{ field: 'resume' }],
    },
  },
  {
    slug: '06-email-channel-only',
    firstName: 'Email',
    lastName: 'ChannelOnly',
    phone: '+966591000006',
    scenario: 'preferredContactChannel email (no WhatsApp send in pipeline)',
    data: {
      jobTitle: 'Office Administrator',
      experienceYears: 5,
      saudiExperience: 3,
      location: 'Riyadh',
      visaStatus: 'nearly_expired',
      availabilityDate: availability(),
      nationality: 'Filipino',
      languages: 'English, Arabic',
      gender: 'female',
      dob: '1991-02-14',
      aboutMe: 'Prefers email over WhatsApp.',
    },
    readyBot: {
      readyBotEnabled: true,
      screeningStatus: 'new',
      whatsappOptIn: true,
      whatsappNumber: '+966591000006',
      preferredContactChannel: 'email',
      missingFields: [{ field: 'resume' }],
    },
  },
  {
    slug: '07-inconsistent-profile',
    firstName: 'Inconsistent',
    lastName: 'Profile',
    phone: '+966591000007',
    scenario: 'Job title vs skill mismatch; partial data; stale screening summary',
    data: {
      jobTitle: 'Senior Software Engineer',
      experienceYears: 1,
      saudiExperience: 0,
      location: 'Remote / Riyadh',
      visaStatus: 'expired',
      availabilityDate: availability(),
      nationality: 'Jordanian',
      languages: 'Arabic, English',
      gender: 'male',
      dob: '1999-08-08',
      aboutMe: 'Claims 10 years plumbing but profile says software.',
      currentEmployer: 'Unknown',
    },
    readyBot: {
      readyBotEnabled: true,
      screeningStatus: 'incomplete',
      whatsappOptIn: true,
      whatsappNumber: '+966591000007',
      screeningSummary:
        'Prior bot run: fit 72% for plumber role but jobTitle says engineer — needs reconciliation.',
      screeningConfidence: 0.72,
      lastScreenedAt: new Date(Date.now() - 86400000).toISOString(),
      missingFields: [
        { field: 'resume' },
        { field: 'experienceYears' },
        { field: 'visaStatus' },
      ],
    },
  },
  {
    slug: '08-needs-human-review',
    firstName: 'Needs',
    lastName: 'HumanReview',
    phone: '+966591000008',
    scenario: 'Already flagged needs_human_review (simulates failed role fit)',
    data: {
      jobTitle: 'Heavy Equipment Operator',
      experienceYears: 12,
      saudiExperience: 10,
      location: 'Jubail',
      visaStatus: 'active',
      availabilityDate: availability(),
      nationality: 'Saudi Arabia',
      languages: 'Arabic',
      gender: 'male',
      dob: '1985-12-01',
      aboutMe: 'Crane and excavator certified.',
    },
    readyBot: {
      readyBotEnabled: true,
      screeningStatus: 'needs_human_review',
      whatsappOptIn: true,
      whatsappNumber: '+966591000008',
      screeningSummary: 'Role fit flagged: visa profession mismatch with job posting.',
      screeningConfidence: 0.45,
      lastScreenedAt: new Date().toISOString(),
      missingFields: [{ field: 'resume' }],
    },
  },
  {
    slug: '09-already-contacted',
    firstName: 'Already',
    lastName: 'Contacted',
    phone: '+966591000009',
    scenario: 'Status contacted + lastContactedAt — scan may skip or follow-up path',
    data: {
      jobTitle: 'Pipe Fitter',
      experienceYears: 7,
      saudiExperience: 5,
      location: 'Khobar',
      visaStatus: 'active',
      availabilityDate: availability(),
      nationality: 'Bangladeshi',
      languages: 'Bengali, Arabic',
      gender: 'male',
      dob: '1987-04-22',
      aboutMe: 'Industrial pipe fitting.',
    },
    readyBot: {
      readyBotEnabled: true,
      screeningStatus: 'contacted',
      whatsappOptIn: true,
      whatsappNumber: '+966591000009',
      lastContactedAt: new Date(Date.now() - 3600000).toISOString(),
      missingFields: [{ field: 'resume' }, { field: 'aboutMe' }],
    },
  },
  {
    slug: '10-reply-pending-parse',
    firstName: 'Reply',
    lastName: 'Pending',
    phone: '+966591000010',
    scenario: 'info_received — mid-inbound; profile/readyBot location mismatch',
    data: {
      jobTitle: 'Carpenter',
      experienceYears: 9,
      saudiExperience: 6,
      location: 'Jeddah',
      visaStatus: 'active',
      availabilityDate: availability(),
      nationality: 'Yemeni',
      languages: 'Arabic',
      gender: 'male',
      dob: '1986-09-17',
      aboutMe: '',
    },
    readyBot: {
      readyBotEnabled: true,
      screeningStatus: 'info_received',
      whatsappOptIn: true,
      whatsappNumber: '+966591000010',
      lastReplyAt: new Date(Date.now() - 600000).toISOString(),
      lastContactedAt: new Date(Date.now() - 86400000).toISOString(),
      screeningSummary: 'Reply said Dammam; profile still Jeddah — needs reconciliation.',
      missingFields: [{ field: 'resume' }, { field: 'aboutMe' }, { field: 'location' }],
    },
  },
]

async function deleteExistingByEmail(
  payload: Awaited<ReturnType<typeof import('payload')['getPayload']>>,
  email: string,
) {
  const existing = await payload.find({
    collection: 'candidates',
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  })
  if (existing.docs[0]) {
    await payload.delete({
      collection: 'candidates',
      id: existing.docs[0].id,
      overrideAccess: true,
    })
  }
}

async function main(): Promise<void> {
  if (!process.env.PAYLOAD_SECRET) {
    throw new Error('PAYLOAD_SECRET is not set in .env')
  }
  if (!(process.env.DATABASE_URI || process.env.DATABASE_URL)) {
    throw new Error('DATABASE_URI or DATABASE_URL must be set in .env')
  }

  const { getPayload } = await import('payload')
  const { default: config } = await import('@payload-config')
  const payload = await getPayload({ config })

  const skills = await payload.find({
    collection: 'skills',
    limit: 1,
    overrideAccess: true,
  })
  const skill = skills.docs[0]
  if (!skill) {
    throw new Error('No skills in DB. Run: pnpm seed:skills')
  }

  const ctx = { disableRevalidate: true as const, skipVectorUpdate: true as const }
  const created: { id: number | string; slug: string; email: string; scenario: string }[] = []

  console.log('\nSeeding ReadyBot QA candidates (password for all:', PASSWORD, ')\n')

  for (let i = 0; i < SEEDS.length; i++) {
    const seed = SEEDS[i]
    const email = `readybot.${seed.slug}@${EMAIL_DOMAIN}`

    await deleteExistingByEmail(payload, email)

    const doc = await payload.create({
      collection: 'candidates',
      data: {
        email,
        password: PASSWORD,
        firstName: seed.firstName,
        lastName: seed.lastName,
        phone: seed.phone,
        whatsapp:
          typeof seed.data.whatsapp === 'string' ? seed.data.whatsapp : seed.phone,
        phoneVerified: true,
        emailVerified: true,
        primarySkill: skill.id,
        termsAccepted: true,
        languages: 'Arabic, English',
        gender: 'male',
        dob: '1990-01-01',
        nationality: 'Saudi Arabia',
        readyBot: seed.readyBot,
        ...seed.data,
      } as never,
      overrideAccess: true,
      context: ctx,
    })

    created.push({ id: doc.id, slug: seed.slug, email, scenario: seed.scenario })
    console.log(`  ✓ ${seed.slug}`)
    console.log(`      id ${doc.id} · ${email}`)
    console.log(`      ${seed.scenario}\n`)
  }

  console.log('─'.repeat(60))
  console.log('Created', created.length, 'candidates')
  console.log('Open dashboard: /en/readybot (admin login)')
  console.log('Run pipeline:  pnpm readybot:scan')
  console.log('Watch steps:   Live tab (workflowRunId per scan batch)')
  console.log('─'.repeat(60))
  console.log('\nQuick reference:\n')
  for (const c of created) {
    console.log(`  ${c.slug.padEnd(22)} ${c.email}`)
  }
  console.log('')
}

main().catch((e) => {
  console.error('seed-readybot-test-candidates: FAILED', e)
  process.exit(1)
})
