import { getCurrentUserType } from '@/lib/currentUserType'
import { redirectToLogin } from '@/lib/redirects'
import { InactivityLogout } from '@/components/auth/InactivityLogout'

export const dynamic = 'force-dynamic'

type AuthLayoutProps = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function AuthLayout({ children, params }: AuthLayoutProps) {
  const { locale } = await params
  const userType = await getCurrentUserType()

  if (!userType) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[AUTH_LAYOUT] No user type, redirecting to login')
    }
    await redirectToLogin(locale)
    throw new Error('Redirect')
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[AUTH_LAYOUT] User authenticated:', userType.kind, userType.user?.email)
  }

  return (
    <InactivityLogout>
      <main className="flex flex-col min-h-screen">
        <section className="flex-1">{children}</section>
      </main>
    </InactivityLogout>
  )
}
