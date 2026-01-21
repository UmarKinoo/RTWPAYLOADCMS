import React from 'react'
import { HomepageSection } from '../HomepageSection'
import { MajorDisciplinesClient } from './MajorDisciplinesClient'
import { getTranslations, getLocale } from 'next-intl/server'
import { getDisciplines } from '@/lib/disciplines'

/**
 * Generate slug from name (fallback if discipline doesn't have slug)
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Figma images mapped by discipline name (from database)
// Includes both corrected names and actual database names for matching
const FIGMA_IMAGE_MAP: Record<string, string> = {
  // Corrected names (for reference)
  'Agriculture & Farm Services': '/assets/disciplines/917b8c2db520242e3f5a1688bf7e2f2bf11d9820.webp',
  'Cafe & Restaurant': '/assets/disciplines/d826842a597cf4f275b759305f610c24ccc8d0c0.webp',
  'Lifestyle & Personal Care': '/assets/disciplines/2c7c001592b660c217064f1458effb19255f8dbb.webp',
  'Mechanical & Auto Repair': '/assets/disciplines/097b84522d9ca844392b50aaa5b73610f15dd197.webp',
  'Media & Visualization': '/assets/disciplines/8a36f35a05e8867a0bf698d48d329c14908d8e4c.webp',
  'Sustainability & Waste': '/assets/disciplines/64f34b277ae47d754a07f44ebc7b75cd26860c11.webp',
  'Transport & Vehicle': '/assets/disciplines/6b2d7bf1ded0d2ff1f3eb710947575dc30ef8fb3.webp',
  
  // Actual database names (from check-disciplines-db.ts output)
  'Agriculture & Animal & Farm Services': '/assets/disciplines/917b8c2db520242e3f5a1688bf7e2f2bf11d9820.webp',
  'Cafe And Restaurant': '/assets/disciplines/d826842a597cf4f275b759305f610c24ccc8d0c0.webp',
  'Life Style & Personal Care': '/assets/disciplines/2c7c001592b660c217064f1458effb19255f8dbb.webp',
  'Mechanical, Auto & Appliance / Repair Services': '/assets/disciplines/097b84522d9ca844392b50aaa5b73610f15dd197.webp',
  'Media & Visuialisation': '/assets/disciplines/8a36f35a05e8867a0bf698d48d329c14908d8e4c.webp',
  'Sustainability And Waste Management': '/assets/disciplines/64f34b277ae47d754a07f44ebc7b75cd26860c11.webp',
  'Transport & Speciality Vehicle': '/assets/disciplines/6b2d7bf1ded0d2ff1f3eb710947575dc30ef8fb3.webp',
  
  // Other disciplines (matching correctly)
  'Business': '/assets/disciplines/e2592868d581a4220b3f5b18f6680e41e6b16f1d.webp',
  'Construction': '/assets/disciplines/8ef927bad934c17ab6c948ddea636fe45328bf54.webp',
  'Education': '/assets/disciplines/29e444883f7acaf3453e7e1b8b432c22dd3b195f.webp',
  'Entertainment & Leisure': '/assets/disciplines/5a6537c468619803e50a4e8a88affbb0a6f74b25.webp',
  'Events & Hospitality': '/assets/disciplines/ca0d7136a6793430357f1aed71378d042716163c.webp',
  'Facility Management': '/assets/disciplines/ee37e2e81115be02a56e755bd886e01749e53950.webp',
  'Healthcare': '/assets/disciplines/6e1044c6c63484140d886a28921bf45bba7548cc.webp',
  'Housekeeping & Home Services': '/assets/disciplines/31b0d877118018231ba48265ad3b1795028001ea.webp',
  'IT': '/assets/disciplines/67ac121b22e917950fef75b0f23b2b80005f5d77.webp',
  'Industrial & Logistic': '/assets/disciplines/df806ef3a37f38f45c61dc8be4094fc8c776515a.webp',
  'Retail': '/assets/disciplines/da8e4bcefdc0520f3f2eed4a58a13fab760fdd28.webp',
}

export async function MajorDisciplines() {
  const t = await getTranslations('homepage.majorDisciplines')
  const locale = await getLocale()
  
  // Fetch disciplines from database
  const disciplines = await getDisciplines(locale)
  
  // Map disciplines to component format with Figma images and actual slugs
  const disciplinesData = disciplines
    .map((discipline) => {
      const image = FIGMA_IMAGE_MAP[discipline.name] || FIGMA_IMAGE_MAP[discipline.name_en || ''] || ''
      
      // Only include if we have an image (matches Figma design)
      if (!image) return null
      
      return {
        title: discipline.localizedName, // Already localized from getDisciplines
        image,
        slug: discipline.slug || generateSlug(discipline.name || discipline.name_en || ''), // Use actual slug from database, fallback to generated
      }
    })
    .filter((d): d is { title: string; image: string; slug: string } => d !== null)
    // Sort by displayOrder to maintain Figma order
    .sort((a, b) => {
      const aDiscipline = disciplines.find(d => d.slug === a.slug)
      const bDiscipline = disciplines.find(d => d.slug === b.slug)
      const aOrder = aDiscipline?.displayOrder ?? 999
      const bOrder = bDiscipline?.displayOrder ?? 999
      return aOrder - bOrder
    })

  return (
    <HomepageSection className="pb-12 sm:pb-16 md:pb-20">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8 md:mb-10">
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold font-inter text-[#16252d] mb-2 sm:mb-3">
          {t('title')}
        </h2>
        <p className="text-sm sm:text-base md:text-lg lg:text-xl font-normal font-inter text-gray-600">
          {t('subtitle')}
        </p>
      </div>

      {/* Disciplines Grid */}
      <MajorDisciplinesClient disciplines={disciplinesData} />
    </HomepageSection>
  )
}
