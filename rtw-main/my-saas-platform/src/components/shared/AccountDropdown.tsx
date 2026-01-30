'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AvatarCircle } from '@/components/navbar/AvatarCircle'
import { ChevronDown, LayoutDashboard, LogOut, DollarSign, FileText, User } from 'lucide-react'
import { clearAuthCookies } from '@/lib/auth'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export type UserRole = 'employer' | 'candidate'

interface AccountDropdownProps {
  displayName: string
  email?: string
  role: UserRole
  avatarSize?: 'sm' | 'md' | 'lg'
  className?: string
  // Role-specific props
  interviewCredits?: number
  contactUnlockCredits?: number
  dashboardUrl?: string
  additionalMenuItems?: React.ReactNode
}

export function AccountDropdown({
  displayName,
  email,
  role,
  avatarSize = 'sm',
  className,
  interviewCredits,
  contactUnlockCredits,
  dashboardUrl,
  additionalMenuItems,
}: AccountDropdownProps) {
  const router = useRouter()
  const t = useTranslations('accountDropdown')

  const handleLogout = async () => {
    try {
      const result = await clearAuthCookies()
      if (result.success) {
        toast.success(t('loggedOutSuccess'))
        router.push('/')
        router.refresh()
      } else {
        toast.error(t('logoutFailed'))
      }
    } catch (error) {
      console.error('Logout error:', error)
      toast.error(t('errorLoggingOut'))
    }
  }

  const roleLabel = role === 'employer' ? t('employer') : t('candidate')
  const defaultDashboardUrl = role === 'employer' ? '/employer/dashboard' : '/dashboard'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2',
            'rounded-lg hover:bg-gray-100 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-[#4644b8] focus:ring-offset-2',
            className,
          )}
          aria-label={t('accountMenu')}
        >
          <AvatarCircle name={displayName} size={avatarSize} />
          <span className="hidden sm:block text-sm font-semibold text-[#16252d] max-w-[120px] sm:max-w-[150px] truncate">
            {displayName}
          </span>
          <ChevronDown className="hidden sm:block size-4 text-[#16252d]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              <span className="text-xs text-muted-foreground bg-[#f5f5f5] px-2 py-0.5 rounded">
                {roleLabel}
              </span>
            </div>
            {email && (
              <p className="text-xs leading-none text-muted-foreground mt-1">
                {email}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Credits Display (Employer only) */}
        {role === 'employer' && (interviewCredits !== undefined || contactUnlockCredits !== undefined) && (
          <>
            <div className="px-2 py-1.5">
              <div className="flex flex-col gap-1.5 text-xs">
                {interviewCredits !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t('interviewCredits')}</span>
                    <span className="font-semibold text-[#4644b8]">{interviewCredits}</span>
                  </div>
                )}
                {contactUnlockCredits !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t('contactUnlocks')}</span>
                    <span className="font-semibold text-[#4644b8]">{contactUnlockCredits}</span>
                  </div>
                )}
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Dashboard Link */}
        <DropdownMenuItem asChild>
          <Link
            href={dashboardUrl || defaultDashboardUrl}
            className="flex items-center gap-2 cursor-pointer"
          >
            <LayoutDashboard className="size-4" />
            <span>{t('dashboard')}</span>
          </Link>
        </DropdownMenuItem>

        {/* Role-specific menu items */}
        {role === 'employer' && (
          <DropdownMenuItem asChild>
            <Link href="/pricing" className="flex items-center gap-2 cursor-pointer">
              <DollarSign className="size-4" />
              <span>{t('pricing')}</span>
            </Link>
          </DropdownMenuItem>
        )}

        {role === 'candidate' && (
          <DropdownMenuItem asChild>
            <Link href="/dashboard/resume" className="flex items-center gap-2 cursor-pointer">
              <FileText className="size-4" />
              <span>{t('myResume')}</span>
            </Link>
          </DropdownMenuItem>
        )}

        {/* Additional menu items */}
        {additionalMenuItems}

        <DropdownMenuSeparator />

        {/* Logout */}
        <DropdownMenuItem
          onClick={handleLogout}
          variant="destructive"
          className="cursor-pointer focus:bg-destructive/10 focus:text-destructive"
        >
          <LogOut className="size-4" />
          <span>{t('logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}







