import { getLocale } from 'next-intl/server'
import { getCurrentUserType } from '@/lib/currentUserType'
import { redirectToLogin, redirectToDashboard } from '@/lib/redirects'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { InterviewOutcomeHistoryPage } from '@/components/admin/InterviewOutcomeHistoryPage'

export const dynamic = 'force-dynamic'

export default async function InterviewOutcomeHistoryModeratorPage() {
  const userType = await getCurrentUserType()
  const locale = await getLocale()

  if (!userType) {
    await redirectToLogin(locale)
    throw new Error('Redirect')
  }

  if (userType.kind !== 'admin' && userType.kind !== 'moderator') await redirectToDashboard(locale)

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'interviews',
    where: {
      or: [
        { status: { equals: 'rejected' } },
        { status: { equals: 'cancelled' } },
        { status: { equals: 'completed' } },
        { status: { equals: 'scheduled' } },
        { rejectedBy: { exists: true } },
      ],
    },
    sort: '-updatedAt',
    limit: 50,
    depth: 1,
  })

  return <InterviewOutcomeHistoryPage interviews={result.docs} locale={locale} />
}
