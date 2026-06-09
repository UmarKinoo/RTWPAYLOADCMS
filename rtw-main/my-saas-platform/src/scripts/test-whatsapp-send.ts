/**
 * Quick WhatsApp send test — creates test candidate if needed and sends template.
 * Usage: pnpm tsx src/scripts/test-whatsapp-send.ts
 */
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../..')
dotenv.config({ path: path.join(root, '.env') })

const PHONE = '+23057494627'
const TEMPLATE = process.env.READYBOT_WHATSAPP_TEMPLATE_NAME || 'hello_world'
const TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!
const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!

async function ensureCandidate() {
  const { getPayload } = await import('payload')
  const { default: config } = await import('@payload-config')
  const payload = await getPayload({ config })

  const existing = await payload.find({
    collection: 'candidates',
    where: { phone: { equals: PHONE } },
    limit: 1,
    overrideAccess: true,
  })

  if (existing.docs[0]) {
    console.log(`✓ Candidate exists: ID ${existing.docs[0].id}`)
    return existing.docs[0]
  }

  const skills = await payload.find({ collection: 'skills', limit: 1, overrideAccess: true })
  const skill = skills.docs[0]
  if (!skill) throw new Error('No skills in DB. Run: pnpm seed:skills')

  const doc = await payload.create({
    collection: 'candidates',
    overrideAccess: true,
    data: {
      email: 'umar.test@readybot-qa.example.test',
      password: 'ReadyBotTest2026!',
      firstName: 'Umar',
      lastName: 'Test',
      phone: PHONE,
      whatsapp: PHONE,
      phoneVerified: true,
      emailVerified: true,
      primarySkill: skill.id,
      termsAccepted: true,
      languages: 'English',
      gender: 'male',
      dob: '1990-01-01',
      nationality: 'Mauritius',
      jobTitle: 'HVAC Technician',
      experienceYears: 6,
      saudiExperience: 4,
      location: 'Riyadh',
      visaStatus: 'active',
      availabilityDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString(),
      aboutMe: '',
      readyBot: {
        readyBotEnabled: true,
        screeningStatus: 'incomplete',
        whatsappOptIn: true,
        whatsappOptInAt: new Date().toISOString(),
        preferredContactChannel: 'whatsapp',
        whatsappNumber: PHONE,
        missingFields: [{ field: 'resume' }, { field: 'aboutMe' }],
      },
    } as never,
    context: { disableRevalidate: true, skipVectorUpdate: true } as never,
  })
  console.log(`✓ Candidate created: ID ${doc.id}`)
  return doc
}

async function sendTemplate() {
  if (!TOKEN || !PHONE_ID) {
    console.error('✗ WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID not set in .env')
    process.exit(1)
  }

  const to = PHONE.replace(/\D/g, '')
  console.log(`\nSending template "${TEMPLATE}" to ${to} via phone ID ${PHONE_ID}...`)

  const res = await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: TEMPLATE,
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [{ type: 'text', text: 'Umar' }],
          },
        ],
      },
    }),
  })

  const json = await res.json()
  if (!res.ok) {
    console.error('✗ Send failed:', JSON.stringify(json, null, 2))
    process.exit(1)
  }

  console.log('✓ Message sent!')
  console.log('  Message ID:', (json as { messages?: { id: string }[] }).messages?.[0]?.id)
}

async function main() {
  await ensureCandidate()
  await sendTemplate()
  console.log('\nCheck your WhatsApp on +230 5749 4627 👆\n')
  process.exit(0)
}

main().catch((e) => {
  console.error('FAILED:', e)
  process.exit(1)
})
