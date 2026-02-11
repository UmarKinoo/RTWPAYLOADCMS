import { getLocale } from 'next-intl/server'
import { getCurrentUserType } from '@/lib/currentUserType'
import { redirectToLogin, redirectToDashboard } from '@/lib/redirects'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { PendingInterviewsPage } from '@/components/admin/PendingInterviewsPage'

export const dynamic = 'force-dynamic'

export default async function PendingInterviewsAdminPage() {
  const userType = await getCurrentUserType()
  const locale = await getLocale()

  if (!userType) {
    await redirectToLogin(locale)
    throw new Error('Redirect')
  }

  if (userType.kind !== 'admin' && userType.kind !== 'moderator') await redirectToDashboard(locale)

  const payload = await getPayload({ config: configPromise })

  // Fetch pending interviews
  const result = await payload.find({
    collection: 'interviews',
    where: {
      status: {
        equals: 'pending',
      },
    },
    sort: '-createdAt',
    limit: 100,
    depth: 2, // Populate employer and candidate
  })

  return <PendingInterviewsPage interviews={result.docs} />
}

