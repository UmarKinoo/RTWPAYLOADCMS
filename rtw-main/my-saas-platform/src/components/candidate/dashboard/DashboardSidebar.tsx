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
  Home,
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
        mobile 
          ? 'h-screen overflow-y-auto overscroll-contain' 
          : 'fixed left-0 top-0 h-screen w-[220px] border-r border-[#ededed] overflow-y-auto overscroll-contain'
      )}
    >
      <div className={cn(
        'flex flex-1 flex-col',
        mobile ? 'px-6 pt-20 pb-24 md:pb-6' : 'p-4' // Extra bottom padding on mobile to account for bottom nav
      )}>
        {/* Header - Logo and Title */}
        <div className={cn('flex items-center gap-2', mobile ? 'mb-8' : 'mb-2')}>
          {/* ReadyToWork Logo */}
          <Link href="/" className="flex-shrink-0" onClick={handleLinkClick}>
            <div className={cn('relative', mobile ? 'h-7 w-[182px]' : 'h-5 w-[130px]')} style={{ aspectRatio: '319/49' }}>
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
            className="fixed right-4 top-4 z-50 h-11 w-11 rounded-full bg-white shadow-lg border-2 border-gray-200 hover:bg-gray-50 active:scale-95 transition-transform"
          >
            <X className="h-5 w-5" />
          </Button>
        )}

        {/* Divider with arrow - only on desktop */}
        {!mobile && (
          <div className="relative my-4">
            <Separator className="bg-[#ededed]" />
            <div className="absolute -right-2 top-1/2 -translate-y-1/2">
              <div className="flex size-5 items-center justify-center rounded-full bg-[#4644b8]">
                <ChevronLeft className="size-3 rotate-180 text-white" />
              </div>
            </div>
          </div>
        )}
        {mobile && <Separator className="mb-6 bg-gray-200" />}

        {/* Main Menu Label */}
        {mobile ? (
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Main Menu
          </h2>
        ) : (
          <p className="mb-4 text-sm font-normal text-[#757575]">
            Main
          </p>
        )}

        {/* Menu Items */}
        <div className={cn('flex flex-col', mobile ? 'gap-2' : 'gap-2')}>
          {[
            { icon: LayoutGrid, label: 'Dashboard', href: '/dashboard' },
            { icon: User, label: 'My Resume', href: '/dashboard/resume' },
            { icon: Bell, label: 'Notification', href: '/dashboard/notifications', badge: unreadNotificationsCount },
            { icon: Settings, label: 'Account Setting', href: '/dashboard/settings' },
            { icon: SlidersHorizontal, label: 'Activity', href: '/dashboard?view=activity' },
          ].map((item) => {
            const Icon = item.icon
            const isActive = 
              pathname === item.href || 
              (item.href.includes('notifications') && pathname?.includes('notifications')) ||
              (item.href.includes('view=activity') && pathname === '/dashboard' && searchParams?.get('view') === 'activity')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className={cn(
                  'group flex items-center gap-3 rounded-lg transition-all',
                  mobile 
                    ? 'px-4 py-3.5 h-auto min-h-[52px]' 
                    : 'px-4 py-3 h-11',
                  isActive
                    ? 'bg-[#4644b8] text-white shadow-md'
                    : 'text-[#353535] hover:bg-gray-50 active:bg-gray-100'
                )}
              >
                <div className={cn(
                  'flex items-center justify-center rounded-lg transition-colors',
                  mobile ? 'h-10 w-10' : 'h-8 w-8',
                  isActive 
                    ? 'bg-white/20' 
                    : 'bg-gray-100 group-hover:bg-gray-200'
                )}>
                  <Icon className={cn(
                    'flex-shrink-0',
                    mobile ? 'h-5 w-5' : 'h-4 w-4',
                    isActive ? 'text-white' : 'text-[#4644b8]'
                  )} />
                </div>
                <span className={cn(
                  'font-medium flex-1',
                  mobile ? 'text-base' : 'text-sm',
                  isActive && 'text-white'
                )}>
                  {item.label}
                </span>
                {item.badge && item.badge > 0 && (
                  <Badge className={cn(
                    'flex items-center justify-center rounded-full text-white flex-shrink-0',
                    mobile ? 'h-6 min-w-6 px-1.5 text-xs font-semibold' : 'size-5 p-0 text-[10px]',
                    isActive ? 'bg-white/30 text-white' : 'bg-[#dc0000]'
                  )}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
                {!mobile && (
                  <ChevronLeft className={cn(
                    'size-4 ml-auto transition-opacity',
                    isActive ? 'text-white/70' : 'text-[#757575]'
                  )} />
                )}
              </Link>
            )
          })}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom Menu */}
        {mobile && <Separator className="mb-4 bg-gray-200" />}
        {mobile && (
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Support
          </h2>
        )}
        <div className={cn('flex flex-col', mobile ? 'gap-2' : 'gap-2')}>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={cn(
              'group flex w-full items-center gap-3 rounded-lg transition-all',
              mobile 
                ? 'px-4 py-3.5 h-auto min-h-[52px]' 
                : 'px-4 py-3 h-11',
              'hover:bg-red-50 active:bg-red-100 disabled:opacity-50 text-[#dc0000]'
            )}
          >
            <div className={cn(
              'flex items-center justify-center rounded-lg bg-red-50 group-hover:bg-red-100 transition-colors',
              mobile ? 'h-10 w-10' : 'h-8 w-8'
            )}>
              <LogOut className={cn('flex-shrink-0 text-[#dc0000]', mobile ? 'h-5 w-5' : 'h-4 w-4')} />
            </div>
            <span className={cn('font-medium flex-1 text-left', mobile ? 'text-base' : 'text-sm')}>
              {isLoggingOut ? 'Logging out...' : 'Log out'}
            </span>
            {!mobile && <ChevronLeft className="size-4 text-[#dc0000] ml-auto opacity-50" />}
          </button>
          <Link
            href="/dashboard/help"
            onClick={handleLinkClick}
            className={cn(
              'group flex items-center gap-3 rounded-lg transition-all',
              mobile 
                ? 'px-4 py-3.5 h-auto min-h-[52px]' 
                : 'px-4 py-3 h-11',
              'text-[#353535] hover:bg-gray-50 active:bg-gray-100'
            )}
          >
            <div className={cn(
              'flex items-center justify-center rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors',
              mobile ? 'h-10 w-10' : 'h-8 w-8'
            )}>
              <HelpCircle className={cn('flex-shrink-0 text-[#4644b8]', mobile ? 'h-5 w-5' : 'h-4 w-4')} />
            </div>
            <span className={cn('font-medium flex-1', mobile ? 'text-base' : 'text-sm')}>Help</span>
            {!mobile && <ChevronLeft className="size-4 text-[#757575] ml-auto" />}
          </Link>
        </div>
      </div>
    </div>
  )
}
