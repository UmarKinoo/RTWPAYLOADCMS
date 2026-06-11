/**
 * Verify candidate profile moderation flow (local DB).
 * Run: pnpm exec tsx src/scripts/verify-candidate-moderation.ts
 */
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

if (!process.env.PAYLOAD_SECRET) {
  console.error('❌ PAYLOAD_SECRET must be set in .env')
  process.exit(1)
}

const { getPayload } = await import('payload')
const { default: config } = await import('@payload-config')
import { publicCandidateWhere, moderationQueueWhere } from '@/lib/candidates/profile-status'
function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`ASSERT: ${message}`)
}

async function main() {
  const payload = await getPayload({ config })

  const skill = await payload.find({ collection: 'skills', limit: 1, overrideAccess: true })
  const skillId = skill.docs[0]?.id
  assert(Boolean(skillId), 'Need at least one skill in DB')

  const stamp = Date.now()
  const email = `moderation.test.${stamp}@example.test`

  const created = await payload.create({
    collection: 'candidates',
    data: {
      firstName: 'Mod',
      lastName: `Test${stamp}`,
      email,
      password: 'TestPass123!',
      phone: `+9665${String(stamp).slice(-8)}`,
      phoneVerified: true,
      primarySkill: skillId!,
      gender: 'male',
      dob: '1990-01-01',
      nationality: 'Saudi Arabia',
      languages: 'English',
      jobTitle: 'Moderation Test Role',
      experienceYears: 3,
      saudiExperience: 1,
      availabilityDate: '2026-12-01',
      location: 'Riyadh',
      visaStatus: 'active',
      termsAccepted: true,
      profileStatus: 'pending_review',
      moderation: {
        submittedAt: new Date().toISOString(),
      },
    },
    overrideAccess: true,
  })

  console.log(`Created test candidate #${created.id} (${email})`)

  const hidden = await payload.find({
    collection: 'candidates',
    where: {
      and: [{ id: { equals: created.id } }, publicCandidateWhere()],
    },
    limit: 1,
    overrideAccess: true,
  })
  assert(hidden.totalDocs === 0, 'Pending candidate must not appear in public query')

  const queued = await payload.find({
    collection: 'candidates',
    where: {
      and: [{ id: { equals: created.id } }, moderationQueueWhere()],
    },
    limit: 1,
    overrideAccess: true,
  })
  assert(queued.totalDocs === 1, 'Candidate should be in moderation queue')

  const admin = await payload.find({
    collection: 'users',
    where: { role: { equals: 'admin' } },
    limit: 1,
    overrideAccess: true,
  })
  assert(admin.docs[0], 'Need an admin user to test approval')

  await payload.update({
    collection: 'candidates',
    id: created.id,
    data: {
      profileStatus: 'approved',
      moderation: {
        ...(created.moderation || {}),
        reviewedAt: new Date().toISOString(),
        reviewedBy: admin.docs[0].id,
      },
    },
    overrideAccess: true,
  })

  const visible = await payload.find({
    collection: 'candidates',
    where: {
      and: [{ id: { equals: created.id } }, publicCandidateWhere()],
    },
    limit: 1,
    overrideAccess: true,
  })
  assert(visible.totalDocs === 1, 'Approved candidate must appear in public query')

  const { sendCandidateModerationReminders } = await import('@/lib/admin/candidate-moderation-reminders')
  const reminderWhenEmpty = await sendCandidateModerationReminders(payload)
  assert(reminderWhenEmpty.sent === false && reminderWhenEmpty.reason === 'queue_empty', 'Reminder should skip when queue empty after approval')

  await payload.delete({ collection: 'candidates', id: created.id, overrideAccess: true })
  console.log('Cleaned up test candidate')

  console.log('\n✅ Candidate moderation verification passed')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Verification failed:', err)
    process.exit(1)
  })
