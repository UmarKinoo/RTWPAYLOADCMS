import { getCurrentUserType } from '@/lib/currentUserType'
import {
  redirectToLogin,
  redirectToAdmin,
  redirectToModeratorPanel,
  redirectToDashboard,
  redirectToNoAccess,
} from '@/lib/redirects'
import { EmployerDashboard } from '@/components/employer/dashboard/EmployerDashboard'

export const dynamic = 'force-dynamic'

type EmployerDashboardPageProps = {
  params: Promise<{ locale: string }>
}

export default async function EmployerDashboardPage({ params }: EmployerDashboardPageProps) {
  const { locale } = await params
  const timestamp = new Date().toISOString()
  console.log(`[EMPLOYER_DASHBOARD ${timestamp}] Page render started`)
  try {
    const userType = await getCurrentUserType()
    console.log(`[EMPLOYER_DASHBOARD ${timestamp}] User type:`, userType ? userType.kind : 'null', userType ? { id: userType.user?.id, email: userType.user?.email } : 'no user')

    if (!userType) {
      console.log(`[EMPLOYER_DASHBOARD ${timestamp}] No user type, redirecting to login`)
      await redirectToLogin(locale)
      throw new Error('Redirect')
    }

    if (userType.kind !== 'employer') {
      console.log(`[EMPLOYER_DASHBOARD ${timestamp}] User is not employer (kind: ${userType.kind}), redirecting appropriately`)
      if (userType.kind === 'admin') await redirectToAdmin()
      if (userType.kind === 'moderator') await redirectToModeratorPanel(locale)
      if (userType.kind === 'candidate') await redirectToDashboard(locale)
      if (userType.kind === 'unknown') await redirectToNoAccess(locale)
      await redirectToDashboard(locale)
      throw new Error('Redirect')
    }

    // TypeScript type narrowing: at this point, userType.kind is 'employer'
    const employer = userType.employer
    console.log(`[EMPLOYER_DASHBOARD ${timestamp}] Rendering employer dashboard for employer:`, employer?.id, employer?.companyName)

    return (
      <div className="min-h-screen bg-[#f5f5f5]">
        <EmployerDashboard employer={employer} />
      </div>
    )
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'digest' in error && String((error as { digest?: string }).digest).startsWith('NEXT_REDIRECT')) {
      throw error
    }
    const timestamp = new Date().toISOString()
    console.error(`[EMPLOYER_DASHBOARD ${timestamp}] Error:`, error)
    await redirectToLogin(locale)
  }
}

