'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AvatarCircle } from './AvatarCircle'
import { ChevronDown, LayoutDashboard, LogOut, DollarSign } from 'lucide-react'
import { clearAuthCookies } from '@/lib/auth'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Employer } from '@/payload-types'

interface UserMenuProps {
  employer: Employer
}

/**
 * Get display name for employer
 * Priority: companyName > responsiblePerson > email prefix
 */
function getDisplayName(employer: Employer): string {
  if (employer.companyName) return employer.companyName
  if (employer.responsiblePerson) return employer.responsiblePerson
  if (employer.email) return employer.email.split('@')[0]
  return 'User'
}

export const UserMenu: React.FC<UserMenuProps> = ({ employer }) => {
  const router = useRouter()
  const displayName = getDisplayName(employer)
  
  // Get wallet credits (default to 0 if not set)
  const interviewCredits = employer.wallet?.interviewCredits ?? 0
  const contactUnlockCredits = employer.wallet?.contactUnlockCredits ?? 0

  const handleLogout = async () => {
    try {
      const result = await clearAuthCookies()
      if (result.success) {
        toast.success('Logged out successfully')
        router.push('/')
        router.refresh()
      } else {
        toast.error('Failed to log out')
      }
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('An error occurred while logging out')
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2',
            'rounded-lg hover:bg-gray-100 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-[#4644b8] focus:ring-offset-2'
          )}
          aria-label="User menu"
        >
          <AvatarCircle name={displayName} initialsFrom={employer.responsiblePerson || displayName} size="sm" />
          <span className="hidden sm:block text-sm font-semibold text-[#16252d] max-w-[120px] sm:max-w-[150px] truncate">
            {displayName}
          </span>
          <ChevronDown className="hidden sm:block size-4 text-[#16252d]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            {employer.email && (
              <p className="text-xs leading-none text-muted-foreground mt-1">
                {employer.email}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Credits Display */}
        <div className="px-2 py-1.5">
          <div className="flex flex-col gap-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Interview Credits</span>
              <span className="font-semibold text-[#4644b8]">{interviewCredits}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Contact Unlocks</span>
              <span className="font-semibold text-[#4644b8]">{contactUnlockCredits}</span>
            </div>
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <Link href="/employer/dashboard" className="flex items-center gap-2 cursor-pointer">
            <LayoutDashboard className="size-4" />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link href="/pricing" className="flex items-center gap-2 cursor-pointer">
            <DollarSign className="size-4" />
            <span>Pricing</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={handleLogout}
          variant="destructive"
          className="cursor-pointer focus:bg-destructive/10 focus:text-destructive"
        >
          <LogOut className="size-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

