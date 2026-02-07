import { LoginPageClient } from '@/components/auth/login-page-client'

import { getCurrentUserType } from '@/lib/currentUserType'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ success?: string; error?: string; collection?: string }>
}) {
  const { locale } = await params
  // Use same gate as (admin) layout so we only redirect when user would pass dashboard auth (avoids redirect loop)
  const userType = await getCurrentUserType({ onLoginPage: true })

  if (userType) {
    const dashboardPath =
      userType.kind === 'employer' ? `/${locale}/employer/dashboard` : `/${locale}/dashboard`
    redirect(dashboardPath)
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
