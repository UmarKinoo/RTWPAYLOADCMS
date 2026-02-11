'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LogOut, ShieldCheck, LayoutDashboard } from 'lucide-react'
import { clearAuthCookies } from '@/lib/auth'
import { useState } from 'react'
import { toast } from 'sonner'

type ModeratorKind = 'admin' | 'moderator'

interface ModeratorHeaderProps {
  kind: ModeratorKind
}

export function ModeratorHeader({ kind }: Readonly<ModeratorHeaderProps>) {
  const pathname = usePathname() ?? ''
  const locale = pathname.split('/')[1] || 'en'
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await clearAuthCookies()
      toast.success('Logged out successfully')
      router.push(`/${locale}/login`)
      router.refresh()
    } catch {
      toast.error('Logout failed')
    } finally {
      setIsLoggingOut(false)
    }
  }

  const label = kind === 'admin' ? 'Admin' : 'Moderator'

  return (
    <header className="sticky top-0 z-40 border-b border-[#e5e5e5] bg-white shadow-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/moderator/interviews/pending`}
            className="flex items-center gap-2 text-[#16252d] hover:opacity-90"
          >
            <LayoutDashboard className="h-6 w-6 text-[#4644b8]" aria-hidden />
            <span className="font-semibold text-[#16252d]">Ready to Work</span>
          </Link>
          <Badge
            variant="secondary"
            className="bg-[#ecf2ff] text-[#4644b8] border-0 font-medium"
          >
            <ShieldCheck className="mr-1 h-3.5 w-3.5" aria-hidden />
            {label}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/${locale}`}>
            <Button variant="ghost" size="sm" className="text-[#757575] hover:text-[#16252d]">
              Back to site
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="border-[#e5e5e5] text-[#16252d] hover:bg-[#fafafa]"
          >
            <LogOut className="mr-1.5 h-4 w-4" aria-hidden />
            {isLoggingOut ? 'Signing out…' : 'Log out'}
          </Button>
        </div>
      </div>
    </header>
  )
}
