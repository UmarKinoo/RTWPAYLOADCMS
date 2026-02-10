'use client'

import React from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface AvatarCircleProps {
  name: string
  /** When set, use this string for initials (e.g. responsible person name for employer avatar). */
  initialsFrom?: string | null
  imageUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Get initials: first letter of name + first letter of surname.
 * For 2+ words uses first word + last word; for 1 word uses first letter only.
 */
export function getInitialsFromName(name: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?'
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * Get initials from first name + last name (for candidate-style display).
 */
export function getInitialsFromFirstLast(
  firstName?: string | null,
  lastName?: string | null,
): string {
  const f = (firstName ?? '').trim()[0]
  const l = (lastName ?? '').trim()[0]
  if (f && l) return (f + l).toUpperCase()
  if (f) return f.toUpperCase()
  if (l) return l.toUpperCase()
  return '?'
}

function getInitials(name: string): string {
  return getInitialsFromName(name)
}

/**
 * Generate a color based on the name (consistent color for same name)
 */
export function getColorFromName(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  // Generate a hue between 0-360
  const hue = hash % 360
  
  // Use a more muted palette (saturation 60%, lightness 50%)
  return `hsl(${hue}, 60%, 50%)`
}

const sizeClasses = {
  sm: 'size-8',
  md: 'size-9',
  lg: 'size-10',
}

export const AvatarCircle: React.FC<AvatarCircleProps> = ({
  name,
  initialsFrom,
  imageUrl,
  size = 'md',
  className,
}) => {
  const initials = getInitials(initialsFrom ?? name)
  const bgColor = getColorFromName(initialsFrom ?? name)

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {imageUrl && (
        <AvatarImage src={typeof imageUrl === 'string' ? imageUrl : undefined} alt={name} />
      )}
      <AvatarFallback
        className="text-white font-semibold text-xs"
        style={{ backgroundColor: bgColor }}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}












