/**
 * Verifies the interview lifecycle in the database (same mutations as moderator approve + candidate accept).
 * Requires .env with PAYLOAD_SECRET, DATABASE_URI (or DATABASE_URL), and at least one employer + one candidate.
 *
 * Usage: pnpm verify:interview-flow
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

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg)
}

async function main(): Promise<void> {
  if (!process.env.PAYLOAD_SECRET) {
    throw new Error(
      'PAYLOAD_SECRET is not set. Add it to .env in the project root before running this script.',
    )
  }
  const dbUrl = process.env.DATABASE_URI || process.env.DATABASE_URL
  if (!dbUrl) {
    throw new Error('DATABASE_URI or DATABASE_URL must be set in .env.')
  }

  const { getPayload } = await import('payload')
  const { default: config } = await import('@payload-config')

  const payload = await getPayload({ config })

  const employers = await payload.find({
    collection: 'employers',
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const candidates = await payload.find({
    collection: 'candidates',
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  const employer = employers.docs[0]
  const candidate = candidates.docs[0]
  if (!employer || !candidate) {
    throw new Error(
      'Need at least one employer and one candidate in the database to run this check.',
    )
  }

  const scheduledAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const marker = `[verify-interview-flow ${Date.now()}]`

  const ctx = { disableRevalidate: true as const }

  const created = await payload.create({
    collection: 'interviews',
    data: {
      employer: employer.id,
      candidate: candidate.id,
      scheduledAt,
      duration: 30,
      status: 'pending',
      notes: marker,
    },
    overrideAccess: true,
    context: ctx,
  })

  try {
    assert(created.status === 'pending', 'Expected pending after create')

    const moderateApproved = await payload.update({
      collection: 'interviews',
      id: created.id,
      data: {
        status: 'scheduled',
        approvedAt: new Date().toISOString(),
      },
      overrideAccess: true,
      context: ctx,
    })

    assert(moderateApproved.status === 'scheduled', 'Expected scheduled after moderator step')
    assert(
      !moderateApproved.candidateAcceptedAt,
      'candidateAcceptedAt should be empty before candidate accepts',
    )

    const acceptedAt = new Date().toISOString()
    const afterAccept = await payload.update({
      collection: 'interviews',
      id: created.id,
      data: {
        candidateAcceptedAt: acceptedAt,
      },
      overrideAccess: true,
      context: ctx,
    })

    assert(
      !!afterAccept.candidateAcceptedAt,
      'candidateAcceptedAt must be set after candidate accept update',
    )

    const notif = await payload.create({
      collection: 'notifications',
      data: {
        employer: employer.id,
        type: 'interview_scheduled',
        title: 'Interview Accepted',
        message: `${marker} verification`,
        read: false,
        actionUrl: `/employer/dashboard?view=interviews&interviewId=${created.id}`,
      },
      overrideAccess: true,
      context: ctx,
    })

    await payload.delete({
      collection: 'notifications',
      id: notif.id,
      overrideAccess: true,
      context: ctx,
    })

    console.log('verify-interview-candidate-flow: OK')
    console.log(
      `  interview ${created.id}: pending → scheduled → candidateAcceptedAt persisted (${afterAccept.candidateAcceptedAt})`,
    )
  } finally {
    await payload.delete({
      collection: 'interviews',
      id: created.id,
      overrideAccess: true,
      context: ctx,
    })
  }
}

main().catch((e) => {
  console.error('verify-interview-candidate-flow: FAILED', e)
  process.exit(1)
})
