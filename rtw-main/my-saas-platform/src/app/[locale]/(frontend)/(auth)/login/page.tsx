import { LoginPageClient } from '@/components/auth/login-page-client'

import { getCurrentUserType } from '@/lib/currentUserType'
import {
  redirectToAdmin,
  redirectToModeratorPanel,
  redirectToEmployerDashboard,
  redirectToDashboard,
  redirectToNoAccess,
} from '@/lib/redirects'

export const dynamic = 'force-dynamic'

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ success?: string; error?: string; collection?: string }>
}) {
  const { locale } = await params
  const userType = await getCurrentUserType({ onLoginPage: true })

  if (userType) {
    if (userType.kind === 'admin') await redirectToAdmin()
    if (userType.kind === 'moderator') await redirectToModeratorPanel(locale)
    if (userType.kind === 'employer') await redirectToEmployerDashboard(locale)
    if (userType.kind === 'candidate') await redirectToDashboard(locale)
    // Unknown: authenticated but unauthorized — send to stable page (no login ↔ dashboard loop)
    if (userType.kind === 'unknown') await redirectToNoAccess(locale)
    await redirectToDashboard(locale)
  }

  const searchParamsResolved = await searchParams

  return (
    <LoginPageClient 
      success={searchParamsResolved.success}
      error={searchParamsResolved.error}
      initialCollection={searchParamsResolved.collection}
    />
  )
}
