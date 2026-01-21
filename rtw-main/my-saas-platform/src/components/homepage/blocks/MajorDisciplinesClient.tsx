'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface DisciplineData {
  title: string
  image: string
  slug: string
}

interface DisciplineCardProps {
  title: string
  image: string
  slug: string
}

const DisciplineCard: React.FC<DisciplineCardProps> = ({
  title,
  image,
  slug,
}) => {
  return (
    <Link
      href={`/candidates?discipline=${slug}`}
      className="flex items-center gap-4 lg:gap-5 xl:gap-6 rounded-[20px] transition-all duration-300 hover:shadow-lg cursor-pointer group bg-gray-100 hover:bg-[#e9d5ff]"
    >
      {/* Image - Square with rounded corners */}
      <div className="flex-shrink-0 w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] md:w-[120px] md:h-[120px] lg:w-[140px] lg:h-[140px] xl:w-[162px] xl:h-[162px] rounded-[16px] sm:rounded-[20px] overflow-hidden relative">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 80px, (max-width: 768px) 100px, (max-width: 1024px) 120px, (max-width: 1280px) 140px, 162px"
        />
      </div>

      {/* Text - on the right */}
      <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-bold font-inter text-[#16252d] leading-tight flex-1 pr-4">
        {title}
      </p>
    </Link>
  )
}

interface MajorDisciplinesClientProps {
  disciplines: DisciplineData[]
}

export const MajorDisciplinesClient: React.FC<MajorDisciplinesClientProps> = ({ disciplines }) => {
  return (
    <>
      {/* Mobile: Single column */}
      <div className="block sm:hidden">
        <div className="grid grid-cols-1 gap-3">
          {disciplines.map((discipline, index) => (
            <DisciplineCard
              key={discipline.slug || index}
              title={discipline.title}
              image={discipline.image}
              slug={discipline.slug}
            />
          ))}
        </div>
      </div>

      {/* Tablet: 2 columns */}
      <div className="hidden sm:grid lg:hidden grid-cols-2 gap-4">
        {disciplines.map((discipline, index) => (
          <DisciplineCard
            key={discipline.slug || index}
            title={discipline.title}
            image={discipline.image}
            slug={discipline.slug}
          />
        ))}
      </div>

      {/* Desktop: 3 columns grid (6 rows x 3 columns) */}
      <div className="hidden lg:grid grid-cols-3 gap-4 xl:gap-6">
        {disciplines.map((discipline, index) => (
          <DisciplineCard
            key={discipline.slug || index}
            title={discipline.title}
            image={discipline.image}
            slug={discipline.slug}
          />
        ))}
      </div>
    </>
  )
}
