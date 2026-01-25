'use client'

import React, { useEffect } from 'react'
import { Link, usePathname } from '@/i18n/routing'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Home, LayoutDashboard, Bell, User, Search } from 'lucide-react'
import type { Employer, Candidate } from '@/payload-types'

interface BottomNavProps {
  employer?: Employer | null
  candidate?: Candidate | null
}

export const BottomNav: React.FC<BottomNavProps> = ({ employer, candidate }) => {
  const t = useTranslations('nav')
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isLoggedIn = !!employer || !!candidate

  // Add padding to body when bottom nav is visible
  useEffect(() => {
    if (isLoggedIn) {
      document.body.classList.add('pb-16', 'md:pb-0')
      return () => {
        document.body.classList.remove('pb-16', 'md:pb-0')
      }
    }
  }, [isLoggedIn])

  // Only show on mobile and when logged in
  if (!isLoggedIn) {
    return null
  }

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/' || pathname === '/en' || pathname === '/ar'
    }
    // Handle query params in href
    const hrefPath = href.split('?')[0]
    const currentPath = pathname || ''
    
    // Special handling for dashboard routes with view params
    if (href.includes('view=')) {
      const viewParam = href.split('view=')[1]?.split('&')[0]
      const currentView = searchParams?.get('view')
      return currentPath === hrefPath && currentView === viewParam
    }
    
    // For base dashboard routes, check if we're on the exact path
    if (hrefPath === '/employer/dashboard' || hrefPath === '/dashboard') {
      const currentView = searchParams?.get('view')
      // If href is base dashboard, only active if no view param
      if (currentPath === hrefPath) {
        return !currentView
      }
      // Also check for /dashboard/notifications route
      if (hrefPath === '/dashboard' && currentPath === '/dashboard/notifications') {
        return false // Notifications has its own route
      }
    }
    
    // For /dashboard/notifications
    if (href === '/dashboard/notifications') {
      return currentPath === '/dashboard/notifications'
    }
    
    return currentPath?.startsWith(hrefPath) || false
  }

  // Employer navigation items
  const employerNavItems = [
    {
      label: 'Home',
      href: '/',
      icon: Home,
    },
    {
      label: 'Dashboard',
      href: '/employer/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Candidates',
      href: '/candidates',
      icon: Search,
    },
    {
      label: 'Notifications',
      href: '/employer/dashboard?view=notifications',
      icon: Bell,
    },
    {
      label: 'Profile',
      href: '/employer/dashboard?view=settings',
      icon: User,
    },
  ]

  // Candidate navigation items
  const candidateNavItems = [
    {
      label: 'Home',
      href: '/',
      icon: Home,
    },
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Notifications',
      href: '/dashboard/notifications',
      icon: Bell,
      badge: false, // We could add unread count here if needed
    },
    {
      label: 'Profile',
      href: '/dashboard?view=profile',
      icon: User,
    },
  ]

  const navItems = employer ? employerNavItems : candidateNavItems

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] md:hidden border-t border-gray-200 bg-white shadow-2xl" style={{ WebkitBackdropFilter: 'blur(10px)', backdropFilter: 'blur(10px)' }}>
      <div className="flex items-center justify-around h-16 px-1 sm:px-2 bg-white/98">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 h-full',
                'transition-all rounded-lg active:scale-95',
                'min-w-0 px-1',
                active
                  ? 'text-[#4644b8]'
                  : 'text-[#757575] active:text-[#4644b8]'
              )}
            >
              <div className="relative flex items-center justify-center">
                <Icon className={cn(
                  'transition-colors',
                  active ? 'h-6 w-6 text-[#4644b8]' : 'h-5 w-5'
                )} />
                {active && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#4644b8] rounded-full" />
                )}
              </div>
              <span className={cn(
                'text-[10px] font-semibold leading-tight text-center px-0.5',
                active && 'text-[#4644b8]'
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
