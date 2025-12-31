'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ImageWithSkeleton } from '@/components/homepage/ImageWithSkeleton'

// Default placeholder image
const DEFAULT_IMAGE = '/assets/ac0fd8c628d0f50b3bdcbedaff88d237be9a96fe.webp'

export interface BlogCardProps {
  slug: string
  image: string | null
  tags: { id: number; name: string }[]
  author: string | null
  date: string
  title: string
  description: string | null
}

export const BlogCard: React.FC<BlogCardProps> = ({
  slug,
  image,
  tags,
  author,
  date,
  title,
  description,
}) => {
  return (
    <Link href={`/posts/${slug}`} className="block group">
      <Card className="overflow-hidden border border-gray-200 rounded-xl hover:shadow-lg transition-shadow h-full bg-white">
        {/* Image */}
        <div className="h-36 sm:h-40 md:h-44 lg:h-48 w-full overflow-hidden relative">
          <ImageWithSkeleton
            src={image || DEFAULT_IMAGE}
            alt={title}
            fill
            objectFit="cover"
            className="group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Content */}
        <CardContent className="p-4 sm:p-5 flex flex-col gap-2.5">
          {/* Tags */}
          <div className="flex gap-1.5 flex-wrap">
            {tags.slice(0, 2).map((tag) => (
              <Badge
                key={tag.id}
                variant="outline"
                className="text-[10px] sm:text-xs px-2 py-0.5 font-normal text-[#757575] border-[#757575]/40"
              >
                {tag.name}
              </Badge>
            ))}
          </div>

          {/* Author and Date */}
          <div className="flex items-center gap-1.5 text-xs text-[#757575]">
            {author && (
              <>
                <span>By {author}</span>
                <span>•</span>
              </>
            )}
            <span>{date}</span>
          </div>

          {/* Title */}
          <h3 className="text-base sm:text-lg md:text-xl font-semibold font-inter text-[#4644b8] leading-tight line-clamp-2">
            {title}
          </h3>

          {/* Description */}
          {description && (
            <p className="text-sm sm:text-base font-normal text-[#757575] leading-relaxed line-clamp-3">
              {description}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
