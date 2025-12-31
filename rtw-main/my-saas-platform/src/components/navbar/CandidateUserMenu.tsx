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
import { ChevronDown, LayoutDashboard, LogOut, FileText } from 'lucide-react'
import { clearAuthCookies } from '@/lib/auth'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Candidate } from '@/payload-types'

interface CandidateUserMenuProps {
  candidate: Candidate
}

/**
 * Get display name for candidate
 * Priority: firstName + lastName > email prefix
 */
function getDisplayName(candidate: Candidate): string {
  if (candidate.firstName && candidate.lastName) {
    return `${candidate.firstName} ${candidate.lastName}`
  }
  if (candidate.email) return candidate.email.split('@')[0]
  return 'User'
}

export const CandidateUserMenu: React.FC<CandidateUserMenuProps> = ({ candidate }) => {
  const router = useRouter()
  const displayName = getDisplayName(candidate)

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
          <AvatarCircle name={displayName} size="sm" />
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
            {candidate.email && (
              <p className="text-xs leading-none text-muted-foreground mt-1">
                {candidate.email}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
            <LayoutDashboard className="size-4" />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link href="/dashboard/resume" className="flex items-center gap-2 cursor-pointer">
            <FileText className="size-4" />
            <span>My Resume</span>
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



