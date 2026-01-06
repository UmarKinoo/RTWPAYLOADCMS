'use client'

import React from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface AvatarCircleProps {
  name: string
  imageUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Get initials from a name
 */
function getInitials(name: string): string {
  if (!name) return '?'
  
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    // Single word - take first 2 characters
    return parts[0].substring(0, 2).toUpperCase()
  }
  
  // Multiple words - take first letter of first two words
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * Generate a color based on the name (consistent color for same name)
 */
function getColorFromName(name: string): string {
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
  imageUrl,
  size = 'md',
  className,
}) => {
  const initials = getInitials(name)
  const bgColor = getColorFromName(name)

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







