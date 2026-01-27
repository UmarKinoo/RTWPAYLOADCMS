import React from 'react'
import { HomepageSection } from '../HomepageSection'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/routing'
import { getTranslations } from 'next-intl/server'

export interface CandidateCardProps {
  name: string
  jobTitle: string
  experience: string
  nationality: string
  nationalityFlag: string
  location: string
  profileImage: string
  billingClass?: 'A' | 'B' | 'C' | 'D' | 'S' | null
  /** When true, show blurred/locked view: displayLabel as name, blur applied, for non-employers */
  locked?: boolean
  /** Shown instead of name when locked (e.g. primary skill or job title) */
  displayLabel?: string
}

// Re-export for convenience
export { CandidateCard } from './CandidatesClient'

export const Candidates: React.FC = async () => {
  const t = await getTranslations('homepage.candidates')
  const count = 0

  return (
    <HomepageSection className="pb-12 sm:pb-16 md:pb-20">
      {/* Background container - full width grey */}
      <div className="bg-[#f5f5f5] rounded-t-3xl sm:rounded-t-[40px] md:rounded-t-[50px] lg:rounded-t-[60px] -mx-4 sm:-mx-6 md:-mx-8 lg:-mx-12 2xl:-mx-[95px] overflow-hidden">
        <div className="px-4 sm:px-6 md:px-8 lg:px-12 2xl:px-[95px] py-8 sm:py-10 md:py-12 lg:py-16">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8 md:mb-10">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold font-inter text-[#16252d] mb-2 sm:mb-3">
              {t('title')}
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl font-normal font-inter text-gray-600">
              {t('subtitle')}
            </p>
          </div>

          {/* Empty state: 0 candidates */}
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 md:py-20 px-4 rounded-2xl bg-white/60 border border-[#e5e5e5]">
            <p className="text-4xl sm:text-5xl md:text-6xl font-bold font-inter text-[#4644b8] mb-2">
              {count}
            </p>
            <p className="text-base sm:text-lg font-medium font-inter text-[#16252d] mb-1">
              {t('candidatesCount', { count })}
            </p>
            <p className="text-sm sm:text-base font-normal font-inter text-[#757575] text-center max-w-md mb-6">
              {t('zeroCandidatesMessage')}
            </p>
            <Link href="/candidates">
              <Button className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-bold uppercase tracking-wide cursor-pointer">
                {t('findMore')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </HomepageSection>
  )
}
