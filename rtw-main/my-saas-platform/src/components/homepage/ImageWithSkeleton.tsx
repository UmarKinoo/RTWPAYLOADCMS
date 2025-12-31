'use client'

import React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface ImageWithSkeletonProps {
  src: string
  alt: string
  className?: string
  fill?: boolean
  width?: number
  height?: number
  priority?: boolean
  style?: React.CSSProperties
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  objectPosition?: string
}

export const ImageWithSkeleton: React.FC<ImageWithSkeletonProps> = ({
  src,
  alt,
  className,
  fill = false,
  width,
  height,
  priority = false,
  style,
  objectFit = 'cover',
  objectPosition = 'center',
}) => {
  return (
    <div className={cn('relative', fill && 'w-full h-full', className)} style={style}>
      <Image
        src={src}
        alt={alt}
        fill={fill}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        priority={priority}
        quality={85}
        loading={priority ? undefined : 'lazy'}
        className={cn(fill && 'absolute inset-0')}
        style={{
          objectFit,
          objectPosition,
        }}
      />
    </div>
  )
}
