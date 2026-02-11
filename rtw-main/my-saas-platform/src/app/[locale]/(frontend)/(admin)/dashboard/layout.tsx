import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { getCurrentUserType } from '@/lib/currentUserType'

export const dynamic = 'force-dynamic'

/**
 * Candidate dashboard layout: keep UI LTR regardless of locale.
 * Moderator and admin users only have access to the moderator panel; redirect them.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const userType = await getCurrentUserType()
  if (userType?.kind === 'moderator' || userType?.kind === 'admin') {
    const locale = await getLocale()
    redirect(`/${locale}/admin/interviews/pending`)
  }
  return <div dir="ltr">{children}</div>
}
