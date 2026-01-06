import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { Discipline } from '@/payload-types'

/**
 * Image mapping for disciplines - maps discipline names to their default images
 * These are used as fallbacks when disciplines don't have custom images uploaded
 */
const DISCIPLINE_IMAGE_MAP: Record<string, { image: string; imageMask: string }> = {
  'Agriculture & Farm Services': {
    image: '/assets/917b8c2db520242e3f5a1688bf7e2f2bf11d9820.webp',
    imageMask: '/assets/de0b09f2f6e12b846a40e655a6b1a573527da183.svg',
  },
  'Construction': {
    image: '/assets/ca0d7136a6793430357f1aed71378d042716163c.webp',
    imageMask: '/assets/de0b09f2f6e12b846a40e655a6b1a573527da183.svg',
  },
  'Housekeeping & Home Services': {
    image: '/assets/e2592868d581a4220b3f5b18f6680e41e6b16f5.webp',
    imageMask: '/assets/de0b09f2f6e12b846a40e655a6b1a573527da183.svg',
  },
  'Events & Hospitality': {
    image: '/assets/ee37e2e81115be02a56e755bd886e01749e53950.webp',
    imageMask: '/assets/de0b09f2f6e12b846a40e655a6b1a573527da183.svg',
  },
  'Business': {
    image: '/assets/29e444883f7acaf3453e7e1b8b432c22dd3b195f.webp',
    imageMask: '/assets/de0b09f2f6e12b846a40e655a6b1a573527da183.svg',
  },
  'Education': {
    image: '/assets/64f34b277ae47d754a07f44ebc7b75cd26860c11.webp',
    imageMask: '/assets/de0b09f2f6e12b846a40e655a6b1a573527da183.svg',
  },
  'IT': {
    image: '/assets/df806ef3a37f38f45c61dc8be4094fc8c776515a.webp',
    imageMask: '/assets/de0b09f2f6e12b846a40e655a6b1a573527da183.svg',
  },
  'Facility Management': {
    image: '/assets/67ac121b22e917950fef75b0f23b2b80005f5d77.webp',
    imageMask: '/assets/de0b09f2f6e12b846a40e655a6b1a573527da183.svg',
  },
  'Cafe & Restaurant': {
    image: '/assets/8a36f35a05e8867a0bf698d48d329c14908d8e4c.webp',
    imageMask: '/assets/de0b09f2f6e12b846a40e655a6b1a573527da183.svg',
  },
  'Entertainment & Leisure': {
    image: '/assets/da8e4bcefdc0520f3f2eed4a58a13fab760fdd28.webp',
    imageMask: '/assets/de0b09f2f6e12b846a40e655a6b1a573527da183.svg',
  },
  'Healthcare': {
    image: '/assets/31b0d877118018231ba48265ad3b1795028001ea.webp',
    imageMask: '/assets/de0b09f2f6e12b846a40e655a6b1a573527da183.svg',
  },
  'Industrial & Logistic': {
    image: '/assets/8a36f35a05e8867a0bf698d48d329c14908d8e4c.webp',
    imageMask: '/assets/de0b09f2f6e12b846a40e655a6b1a573527da183.svg',
  },
  'Lifestyle & Personal Care': {
    image: '/assets/8ef927bad934c17ab6c948ddea636fe45328bf54.webp',
    imageMask: '/assets/de0b09f2f6e12b846a40e655a6b1a573527da183.svg',
  },
  'Retail': {
    image: '/assets/d826842a597cf4f275b759305f610c24ccc8d0c0.webp',
    imageMask: '/assets/de0b09f2f6e12b846a40e655a6b1a573527da183.svg',
  },
  'Mechanical & Auto Repair': {
    image: '/assets/5a6537c468619803e50a4e8a88affbb0a6f74b25.webp',
    imageMask: '/assets/de0b09f2f6e12b846a40e655a6b1a573527da183.svg',
  },
  'Sustainability & Waste': {
    image: '/assets/6b2d7bf1ded0d2ff1f3eb710947575dc30ef8fb3.webp',
    imageMask: '/assets/de0b09f2f6e12b846a40e655a6b1a573527da183.svg',
  },
  'Media & Visualization': {
    image: '/assets/097b84522d9ca844392b50aaa5b73610f15dd197.webp',
    imageMask: '/assets/de0b09f2f6e12b846a40e655a6b1a573527da183.svg',
  },
  'Transport & Vehicle': {
    image: '/assets/6e1044c6c63484140d886a28921bf45bba7548cc.webp',
    imageMask: '/assets/de0b09f2f6e12b846a40e655a6b1a573527da183.svg',
  },
}

/**
 * Get default image for a discipline by name
 */
export function getDisciplineImage(disciplineName: string): { image: string; imageMask: string } {
  return (
    DISCIPLINE_IMAGE_MAP[disciplineName] || {
      image: '/assets/de0b09f2f6e12b846a40e655a6b1a573527da183.svg',
      imageMask: '/assets/de0b09f2f6e12b846a40e655a6b1a573527da183.svg',
    }
  )
}

/**
 * Get localized name for a discipline
 */
export function getLocalizedDisciplineName(discipline: Discipline, locale: string): string {
  if (locale === 'ar' && discipline.name_ar) {
    return discipline.name_ar
  }
  if (locale === 'en' && discipline.name_en) {
    return discipline.name_en
  }
  // Fallback to name_en if available, otherwise use name
  return discipline.name_en || discipline.name || ''
}

/**
 * Fetch all disciplines from the database, sorted by displayOrder
 * Returns disciplines with localized names based on locale
 */
export async function getDisciplines(locale: string = 'en'): Promise<Array<Discipline & { localizedName: string }>> {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'disciplines',
    sort: 'displayOrder',
    limit: 1000,
  })

  return result.docs.map((discipline) => ({
    ...discipline,
    localizedName: getLocalizedDisciplineName(discipline, locale),
  }))
}

