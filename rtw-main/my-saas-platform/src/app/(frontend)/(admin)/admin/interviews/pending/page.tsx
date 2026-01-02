import { redirect } from 'next/navigation'
import { getCurrentUserType } from '@/lib/currentUserType'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { PendingInterviewsPage } from '@/components/admin/PendingInterviewsPage'

export const dynamic = 'force-dynamic'

export default async function PendingInterviewsAdminPage() {
  const userType = await getCurrentUserType()

  if (!userType) {
    redirect('/login')
  }

  // Only allow admin users
  if (userType.kind !== 'admin') {
    redirect('/dashboard')
  }

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

