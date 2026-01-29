import { LoginPageClient } from '@/components/auth/login-page-client'

import { getUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

import type { User } from '@/payload-types'

export const dynamic = 'force-dynamic'

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ success?: string; error?: string; collection?: string }>
}) {
  const { locale } = await params
  const user: User | null = await getUser({ onLoginPage: true })

  if (user) {
    redirect(`/${locale}/dashboard`)
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
