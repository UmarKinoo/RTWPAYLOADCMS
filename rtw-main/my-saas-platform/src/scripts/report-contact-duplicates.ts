/**
 * Read-only report of emails/phones shared across candidates and employers.
 * Does not modify data — use results to clean up manually in Payload admin.
 *
 * Usage: pnpm report:contact-duplicates
 */
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../..')
const envResult = dotenv.config({ path: path.join(root, '.env') })
if (envResult.error) {
  console.warn('Warning: could not load .env:', envResult.error.message)
}

function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null
  const v = email.toLowerCase().trim()
  return v || null
}

async function main(): Promise<void> {
  if (!process.env.PAYLOAD_SECRET) {
    throw new Error('PAYLOAD_SECRET is not set.')
  }
  if (!(process.env.DATABASE_URI || process.env.DATABASE_URL)) {
    throw new Error('DATABASE_URI or DATABASE_URL must be set.')
  }

  const { getPayload } = await import('payload')
  const { default: config } = await import('@payload-config')
  const { normalizePhone } = await import('@/server/sms/taqnyat')

  const payload = await getPayload({ config })

  const [candidates, employers] = await Promise.all([
    payload.find({
      collection: 'candidates',
      limit: 10000,
      depth: 0,
      overrideAccess: true,
      select: {
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
      },
    }),
    payload.find({
      collection: 'employers',
      limit: 10000,
      depth: 0,
      overrideAccess: true,
      select: {
        email: true,
        phone: true,
        companyName: true,
        responsiblePerson: true,
      },
    }),
  ])

  type CandRow = {
    id: string | number
    email: string | null
    phone: string | null
    label: string
  }
  type EmpRow = {
    id: string | number
    email: string | null
    phone: string | null
    label: string
  }

  const candRows: CandRow[] = candidates.docs.map((c) => ({
    id: c.id,
    email: normalizeEmail(c.email),
    phone: c.phone ? String(c.phone).trim() || null : null,
    label: `${c.firstName || ''} ${c.lastName || ''}`.trim() || String(c.id),
  }))

  const empRows: EmpRow[] = employers.docs.map((e) => ({
    id: e.id,
    email: normalizeEmail(e.email),
    phone: e.phone ? String(e.phone).trim() || null : null,
    label: e.companyName || e.responsiblePerson || String(e.id),
  }))

  const emailMap = new Map<string, { candidates: CandRow[]; employers: EmpRow[] }>()
  for (const c of candRows) {
    if (!c.email) continue
    const entry = emailMap.get(c.email) || { candidates: [], employers: [] }
    entry.candidates.push(c)
    emailMap.set(c.email, entry)
  }
  for (const e of empRows) {
    if (!e.email) continue
    const entry = emailMap.get(e.email) || { candidates: [], employers: [] }
    entry.employers.push(e)
    emailMap.set(e.email, entry)
  }

  const phoneKey = (raw: string): string | null => {
    try {
      return normalizePhone(raw)
    } catch {
      return raw.trim() || null
    }
  }

  const phoneMap = new Map<string, { candidates: CandRow[]; employers: EmpRow[] }>()
  for (const c of candRows) {
    if (!c.phone) continue
    const key = phoneKey(c.phone)
    if (!key) continue
    const entry = phoneMap.get(key) || { candidates: [], employers: [] }
    entry.candidates.push(c)
    phoneMap.set(key, entry)
  }
  for (const e of empRows) {
    if (!e.phone) continue
    const key = phoneKey(e.phone)
    if (!key) continue
    const entry = phoneMap.get(key) || { candidates: [], employers: [] }
    entry.employers.push(e)
    phoneMap.set(key, entry)
  }

  const emailDupes = [...emailMap.entries()].filter(
    ([, v]) => v.candidates.length > 0 && v.employers.length > 0,
  )
  const phoneDupes = [...phoneMap.entries()].filter(
    ([, v]) => v.candidates.length > 0 && v.employers.length > 0,
  )

  console.log('=== Cross-collection contact duplicates (read-only) ===')
  console.log(`Candidates scanned: ${candRows.length}`)
  console.log(`Employers scanned: ${empRows.length}`)
  console.log('')

  console.log(`Shared emails: ${emailDupes.length}`)
  for (const [email, v] of emailDupes) {
    console.log(`  ${email}`)
    for (const c of v.candidates) {
      console.log(`    candidate #${c.id} — ${c.label}`)
    }
    for (const e of v.employers) {
      console.log(`    employer #${e.id} — ${e.label}`)
    }
  }

  console.log('')
  console.log(`Shared phones: ${phoneDupes.length}`)
  for (const [phone, v] of phoneDupes) {
    console.log(`  ${phone}`)
    for (const c of v.candidates) {
      console.log(`    candidate #${c.id} — ${c.label}`)
    }
    for (const e of v.employers) {
      console.log(`    employer #${e.id} — ${e.label}`)
    }
  }

  if (emailDupes.length === 0 && phoneDupes.length === 0) {
    console.log('')
    console.log('OK — no shared emails or phones between candidates and employers.')
  } else {
    console.log('')
    console.log('Resolve duplicates manually in Payload admin. New registrations are blocked.')
  }
}

main().catch((e) => {
  console.error('report:contact-duplicates FAILED', e)
  process.exit(1)
})
