import React from 'react'
import { HomepageSection } from '../HomepageSection'
import { getDisciplines, getDisciplineImage } from '@/lib/disciplines'
import { MajorDisciplinesClient } from './MajorDisciplinesClient'
import { getTranslations, getLocale } from 'next-intl/server'

export async function MajorDisciplines() {
  const t = await getTranslations('homepage.majorDisciplines')
  const locale = await getLocale()
  
  // Fetch disciplines from database with localized names
  const disciplines = await getDisciplines(locale)

  // Map disciplines to component data format with default images
  const disciplinesData = disciplines.map((discipline) => {
    // Use original name for image mapping (images are keyed by English name)
    const originalName = discipline.name_en || discipline.name || ''
    const { image, imageMask } = getDisciplineImage(originalName)
    return {
      title: discipline.localizedName, // Use localized name for display
      image,
      imageMask,
      isHighlighted: discipline.isHighlighted || false,
      slug: discipline.slug || null,
    }
  })

  return (
    <HomepageSection className="pb-12 sm:pb-16 md:pb-20">
      {/* Background container */}
      <div className="bg-white rounded-t-3xl sm:rounded-t-[40px] md:rounded-t-[50px] lg:rounded-t-[60px] -mx-4 sm:-mx-6 md:-mx-8 lg:-mx-12 2xl:-mx-[95px] overflow-hidden">
        <div className="px-4 sm:px-6 md:px-8 lg:px-12 2xl:px-[95px] py-8 sm:py-10 md:py-12 lg:py-16">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8 md:mb-10 lg:mb-12">
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold font-inter text-[#16252d] mb-2 sm:mb-3 md:mb-4 leading-tight">
              {t('title')}
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl font-medium font-inter text-[#16252d]/80 max-w-2xl mx-auto">
              {t('subtitle')}
            </p>
          </div>

          {/* Disciplines Grid/Carousel */}
          <MajorDisciplinesClient disciplines={disciplinesData} />
        </div>
      </div>
    </HomepageSection>
  )
}
