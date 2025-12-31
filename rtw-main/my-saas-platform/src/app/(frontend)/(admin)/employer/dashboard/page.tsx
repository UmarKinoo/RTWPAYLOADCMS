import { redirect } from 'next/navigation'
import { getCurrentEmployer } from '@/lib/employer'
import { getUser } from '@/lib/auth'
import { EmployerDashboard } from '@/components/employer/dashboard/EmployerDashboard'

export const dynamic = 'force-dynamic'

export default async function EmployerDashboardPage() {
  // Check if user is authenticated first
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  // Ensure user is an employer
  if (user.collection !== 'employers') {
    redirect('/dashboard')
  }

  const employer = await getCurrentEmployer()

  // SECURITY: If employer exists, verify it belongs to the authenticated user
  if (employer) {
    // Double-check email matches (additional security layer)
    if (employer.email !== user.email) {
      console.error('SECURITY ALERT: Dashboard access denied - email mismatch', {
        employerEmail: employer.email,
        userEmail: user.email,
        employerId: employer.id,
        userId: user.id,
      })
      redirect('/login')
    }
  }

  // If user exists but no employer profile, redirect to employer registration
  if (!employer) {
    redirect('/employer/register')
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <EmployerDashboard employer={employer} />
    </div>
  )
}

