import { redirect } from 'next/navigation'
import { getCurrentUserType } from '@/lib/currentUserType'
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
      console.log(`[EMPLOYER_DASHBOARD ${timestamp}] No user type, redirecting to /login`)
      redirect(`/${locale}/login`)
    }

    // Only allow employers to access this page
    if (userType.kind !== 'employer') {
      // Redirect admins to admin dashboard, others to main dashboard
      console.log(`[EMPLOYER_DASHBOARD ${timestamp}] User is not employer (kind:`, userType.kind, '), redirecting to /dashboard')
      if (userType.kind === 'admin') {
        redirect(`/${locale}/dashboard`)
      }
      redirect(`/${locale}/dashboard`)
    }

    // TypeScript type narrowing: at this point, userType.kind is 'employer'
    const employer = userType.employer
    console.log(`[EMPLOYER_DASHBOARD ${timestamp}] Rendering employer dashboard for employer:`, employer?.id, employer?.companyName)

    return (
      <div className="min-h-screen bg-[#f5f5f5]">
        <EmployerDashboard employer={employer} />
      </div>
    )
  } catch (error) {
    const timestamp = new Date().toISOString()
    console.error(`[EMPLOYER_DASHBOARD ${timestamp}] Error:`, error)
    redirect(`/${locale}/login`)
  }
}

