import { getLocale } from 'next-intl/server'
import { getCurrentUserType } from '@/lib/currentUserType'
import { redirectToAdmin, redirectToModeratorPanel, redirectToNoAccess } from '@/lib/redirects'

export const dynamic = 'force-dynamic'

/**
 * Candidate dashboard layout: keep UI LTR regardless of locale.
 * Admin/moderator/unknown are redirected to their correct surface.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const userType = await getCurrentUserType()
  const locale = await getLocale()
  if (userType?.kind === 'admin') await redirectToAdmin()
  if (userType?.kind === 'moderator') await redirectToModeratorPanel(locale)
  if (userType?.kind === 'unknown') await redirectToNoAccess(locale)
  return <div dir="ltr">{children}</div>
}
