import { getLocale } from 'next-intl/server'
import { getCurrentUserType } from '@/lib/currentUserType'
import { redirectToLogin, redirectToDashboard } from '@/lib/redirects'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { PendingCandidatesPage } from '@/components/admin/PendingCandidatesPage'
import { moderationQueueWhere } from '@/lib/candidates/profile-status'

export const dynamic = 'force-dynamic'

export default async function PendingCandidatesModeratorPage() {
  const userType = await getCurrentUserType()
  const locale = await getLocale()

  if (!userType) {
    await redirectToLogin(locale)
    throw new Error('Redirect')
  }

  if (userType.kind !== 'admin' && userType.kind !== 'moderator') {
    await redirectToDashboard(locale)
  }

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'candidates',
    where: moderationQueueWhere(),
    sort: '-createdAt',
    limit: 100,
    depth: 2,
    overrideAccess: true,
  })

  return <PendingCandidatesPage candidates={result.docs} locale={locale} />
}
