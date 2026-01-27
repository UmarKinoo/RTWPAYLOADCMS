import { redirect } from 'next/navigation'
import { getCurrentUserType } from '@/lib/currentUserType'
import { ModeratorHeader } from '@/components/admin/ModeratorHeader'

export const dynamic = 'force-dynamic'

type AdminLayoutProps = Readonly<{
  children: React.ReactNode
  params?: Promise<{ locale?: string }>
}>

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const userType = await getCurrentUserType()

  if (!userType) {
    redirect('/login')
  }

  if (userType.kind !== 'admin' && userType.kind !== 'moderator') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <ModeratorHeader kind={userType.kind} />
      <main className="mx-auto max-w-6xl">{children}</main>
    </div>
  )
}
