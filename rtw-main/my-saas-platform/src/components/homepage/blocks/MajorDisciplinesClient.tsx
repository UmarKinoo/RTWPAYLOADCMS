'use client'

import React from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ImageWithSkeleton } from '../ImageWithSkeleton'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'

interface DisciplineCardProps {
  title: string
  image: string
  imageMask?: string
  isHighlighted?: boolean
  slug?: string
}

const DisciplineCard: React.FC<DisciplineCardProps> = ({ title, image, imageMask, isHighlighted = false, slug }) => {
  const cardContent = (
    <Card
      className={cn(
        'flex items-center gap-3 p-3 sm:p-4 rounded-xl transition-all duration-300 hover:shadow-md border-0 min-h-[72px] sm:min-h-[80px] cursor-pointer',
        isHighlighted ? 'bg-[#e9d5ff]' : 'bg-gray-100',
        'hover:bg-gray-200'
      )}
    >
      {/* Image */}
      <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg overflow-hidden relative">
        {imageMask ? (
          <div
            className="w-full h-full relative"
            style={{
              maskImage: `url('${imageMask}')`,
              WebkitMaskImage: `url('${imageMask}')`,
              maskSize: 'cover',
              maskPosition: 'center',
              maskRepeat: 'no-repeat',
            }}
          >
            <ImageWithSkeleton src={image} alt={title} fill objectFit="cover" />
          </div>
        ) : (
          <ImageWithSkeleton src={image} alt={title} fill objectFit="cover" />
        )}
      </div>

      {/* Text - with line clamping to prevent overflow */}
      <p className="text-sm sm:text-base md:text-lg font-semibold font-inter text-[#16252d] leading-tight flex-1 line-clamp-2">
        {title}
      </p>
    </Card>
  )

  // If slug is provided, wrap in Link, otherwise return card as-is
  if (slug) {
    return (
      <Link href={`/candidates?discipline=${slug}`} className="block">
        {cardContent}
      </Link>
    )
  }

  return cardContent
}

interface DisciplineData {
  title: string
  image: string
  imageMask: string
  isHighlighted: boolean
  slug?: string
}

interface MajorDisciplinesClientProps {
  disciplines: DisciplineData[]
}

export const MajorDisciplinesClient: React.FC<MajorDisciplinesClientProps> = ({ disciplines }) => {
  return (
    <>
      {/* Mobile: Carousel */}
      <div className="block md:hidden">
        <Carousel
          opts={{
            align: 'start',
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2">
            {disciplines.map((discipline, index) => (
              <CarouselItem key={index} className="pl-2 basis-[85%] sm:basis-1/2">
                <DisciplineCard
                  title={discipline.title}
                  image={discipline.image}
                  imageMask={discipline.imageMask}
                  isHighlighted={discipline.isHighlighted}
                  slug={discipline.slug}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="flex justify-center gap-2 mt-4">
            <CarouselPrevious className="static translate-y-0" />
            <CarouselNext className="static translate-y-0" />
          </div>
        </Carousel>
      </div>

      {/* Desktop: Grid */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {disciplines.map((discipline, index) => (
          <DisciplineCard
            key={index}
            title={discipline.title}
            image={discipline.image}
            imageMask={discipline.imageMask}
            isHighlighted={discipline.isHighlighted}
            slug={discipline.slug}
          />
        ))}
      </div>
    </>
  )
}

