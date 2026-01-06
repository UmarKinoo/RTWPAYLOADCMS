import { redirect } from 'next/navigation'
import { getCurrentUserType } from '@/lib/currentUserType'

export const dynamic = 'force-dynamic'

type AuthLayoutProps = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function AuthLayout({ children, params }: AuthLayoutProps) {
  const { locale } = await params
  const userType = await getCurrentUserType()

  if (!userType) {
    console.log('[AUTH_LAYOUT] No user type, redirecting to /login')
    redirect(`/${locale}/login`)
  }

  console.log('[AUTH_LAYOUT] User authenticated:', userType.kind, userType.user?.email)

  return (
    <main className="flex flex-col min-h-screen">
      <section className="flex-1">{children}</section>
    </main>
  )
}
