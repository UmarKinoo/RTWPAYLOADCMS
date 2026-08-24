import React from 'react'
import { HomepageSection } from '../HomepageSection'
import { MajorDisciplinesClient } from './MajorDisciplinesClient'
import { getTranslations, getLocale } from 'next-intl/server'
import { getDisciplines } from '@/lib/disciplines'
import { disciplineSlugFromName } from '@/lib/candidates/discipline-filter'
import { getDisciplineImage } from '@/lib/disciplines/images'

export async function MajorDisciplines() {
  const t = await getTranslations('homepage.majorDisciplines')
  const locale = await getLocale()

  const disciplines = await getDisciplines(locale)

  const disciplinesData = disciplines
    .map((discipline) => {
      const image = getDisciplineImage(discipline.name, discipline.name_en) || ''
      if (!image) return null

      const rawTitle = discipline.localizedName
      const title =
        rawTitle === 'Media & Visuialisation' || rawTitle === 'Media & Visualisation'
          ? 'Media & Visualization'
          : rawTitle
      return {
        title,
        image,
        slug:
          discipline.slug ||
          disciplineSlugFromName(discipline.name || discipline.name_en || ''),
      }
    })
    .filter((d): d is { title: string; image: string; slug: string } => d !== null)
    .sort((a, b) => {
      const aDiscipline = disciplines.find((d) => d.slug === a.slug)
      const bDiscipline = disciplines.find((d) => d.slug === b.slug)
      const aOrder = aDiscipline?.displayOrder ?? 999
      const bOrder = bDiscipline?.displayOrder ?? 999
      return aOrder - bOrder
    })

  return (
    <HomepageSection className="pb-12 sm:pb-16 md:pb-20">
      <div className="text-center mb-6 sm:mb-8 md:mb-10">
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold font-inter text-[#16252d] mb-2 sm:mb-3">
          {t('title')}
        </h2>
        <p className="text-sm sm:text-base md:text-lg lg:text-xl font-normal font-inter text-gray-600">
          {t('subtitle')}
        </p>
      </div>

      <MajorDisciplinesClient disciplines={disciplinesData} />
    </HomepageSection>
  )
}
