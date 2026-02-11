import { getLocale } from 'next-intl/server'
import { getCurrentUserType } from '@/lib/currentUserType'
import { redirectToLogin, redirectToAdmin, redirectToDashboard } from '@/lib/redirects'
import { ModeratorHeader } from '@/components/admin/ModeratorHeader'

export const dynamic = 'force-dynamic'

type ModeratorLayoutProps = Readonly<{
  children: React.ReactNode
  params?: Promise<{ locale?: string }>
}>

export default async function ModeratorLayout({ children }: ModeratorLayoutProps) {
  const userType = await getCurrentUserType()
  const locale = await getLocale()

  if (!userType) {
    await redirectToLogin(locale)
    throw new Error('Redirect')
  }

  if (userType.kind === 'admin') await redirectToAdmin()

  if (userType.kind !== 'moderator') await redirectToDashboard(locale)

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <ModeratorHeader kind={userType.kind as 'admin' | 'moderator'} />
      <main className="mx-auto max-w-6xl">{children}</main>
    </div>
  )
}
