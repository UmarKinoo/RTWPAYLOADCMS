'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutGrid,
  User,
  Bell,
  Settings,
  SlidersHorizontal,
  LogOut,
  HelpCircle,
  X,
  ChevronLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { clearAuthCookies } from '@/lib/auth'
import { toast } from 'sonner'

// Logo image - the full combined logo
const logoSrc = '/assets/03bdd9d6f0fa9e8b68944b910c59a8474fc37999.svg'

// menuItems will be created inside component to access unreadNotificationsCount

interface DashboardSidebarProps {
  mobile?: boolean
  onClose?: () => void
  unreadNotificationsCount?: number
}

export function DashboardSidebar({ mobile = false, onClose, unreadNotificationsCount = 0 }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const result = await clearAuthCookies()

      if (result.success) {
        toast.success('Logged out successfully', {
          description: 'You have been signed out of your account.',
        })
        router.push('/')
        router.refresh()
      } else {
        toast.error('Logout failed', {
          description: 'Please try again.',
        })
        setIsLoggingOut(false)
      }
    } catch (error) {
      toast.error('Logout failed', {
        description: 'Please try again.',
      })
      setIsLoggingOut(false)
    }
  }

  const handleLinkClick = () => {
    if (mobile && onClose) {
      onClose()
    }
  }

  return (
    <div
      className={cn(
        'flex h-full w-full flex-col bg-white',
        mobile ? 'h-screen' : 'fixed left-0 top-0 h-screen w-[220px] border-r border-[#ededed]'
      )}
    >
      <div className="flex flex-1 flex-col p-4">
        {/* Header - Logo and Title */}
        <div className="mb-2 flex items-center gap-2">
          {/* ReadyToWork Logo */}
          <Link href="/" className="flex-shrink-0">
            <div className="relative h-5 w-[130px]" style={{ aspectRatio: '319/49' }}>
              <Image
                src={logoSrc}
                alt="Ready to Work"
                fill
                className="object-contain object-left"
                priority
              />
            </div>
          </Link>
        </div>

        {/* Close button for mobile */}
        {mobile && onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute right-2 top-2 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        {/* Divider with arrow */}
        <div className="relative my-4">
          <Separator className="bg-[#ededed]" />
          <div className="absolute -right-2 top-1/2 -translate-y-1/2">
            <div className="flex size-5 items-center justify-center rounded-full bg-[#4644b8]">
              <ChevronLeft className="size-3 rotate-180 text-white" />
            </div>
          </div>
        </div>

        {/* Main Menu Label */}
        <p className="mb-4 text-sm font-normal text-[#757575]">
          Main
        </p>

        {/* Menu Items */}
        <div className="flex flex-col gap-2">
          {[
            { icon: LayoutGrid, label: 'Dashboard', href: '/dashboard' },
            { icon: User, label: 'My Resume', href: '/dashboard/resume' },
            { icon: Bell, label: 'Notification', href: '/dashboard?view=notifications', badge: unreadNotificationsCount },
            { icon: Settings, label: 'Account Setting', href: '/dashboard/settings' },
            { icon: SlidersHorizontal, label: 'Activity', href: '/dashboard?view=activity' },
          ].map((item) => {
            const Icon = item.icon
            const isActive = 
              pathname === item.href || 
              (item.href.includes('view=notifications') && pathname === '/dashboard' && searchParams?.get('view') === 'notifications') ||
              (item.href.includes('view=activity') && pathname === '/dashboard' && searchParams?.get('view') === 'activity')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className={cn(
                  'flex h-11 items-center gap-2 rounded-lg px-3 py-2 transition-colors',
                  isActive
                    ? 'bg-[#ededed] text-[#353535]'
                    : 'text-[#353535] hover:bg-[#f4f4f4]'
                )}
              >
                <ChevronLeft className="size-4 text-[#757575]" />
                <span className="text-sm font-medium">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <Badge className="ml-auto flex size-5 items-center justify-center rounded-full bg-[#dc0000] p-0 text-[10px] text-white">
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
              </Link>
            )
          })}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom Menu */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex h-11 w-full items-center gap-2 rounded-lg px-3 py-2 text-[#dc0000] transition-colors hover:bg-[#f4f4f4] disabled:opacity-50"
          >
            <ChevronLeft className="size-4" />
            <span className="text-sm font-medium">{isLoggingOut ? 'Logging out...' : 'Log out'}</span>
          </button>
          <Link
            href="/dashboard/help"
            onClick={handleLinkClick}
            className="flex h-11 items-center gap-2 rounded-lg px-3 py-2 text-[#353535] transition-colors hover:bg-[#f4f4f4]"
          >
            <ChevronLeft className="size-4 text-[#757575]" />
            <span className="text-sm font-medium">Help</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
