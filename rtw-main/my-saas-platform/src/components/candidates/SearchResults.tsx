'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { CandidateCard } from '@/components/homepage/blocks/Candidates'
import { AddToInterviewButton } from '@/components/employer/AddToInterviewButton'
import { formatExperience, getNationalityFlag } from '@/lib/utils/candidate-utils'
import { Link } from '@/i18n/routing'
import type { CandidateListItem } from '@/lib/payload/candidates'
import { searchCandidates } from '@/lib/employer/search'

interface SearchResultsProps {
  searchQuery: string
  locale: string
}

export function SearchResults({ searchQuery, locale }: SearchResultsProps) {
  const t = useTranslations('candidatesPage')
  const [candidates, setCandidates] = useState<CandidateListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!searchQuery.trim()) {
      setIsLoading(false)
      return
    }

    const performSearch = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const result = await searchCandidates(searchQuery.trim(), 20)
        setCandidates(result.candidates || [])
      } catch (err: any) {
        console.error('Search error:', err)
        const errorMessage = err.message || t('searchErrors.failed')
        setError(
          errorMessage.includes('Unauthorized')
            ? t('searchErrors.unauthorized')
            : errorMessage.includes('not yet supported')
            ? t('searchErrors.notSupported')
            : errorMessage
        )
        setCandidates([])
      } finally {
        setIsLoading(false)
      }
    }

    performSearch()
  }, [searchQuery])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-[#757575]">{t('searching')}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg font-semibold text-[#16252d] mb-2">
          {t('searchError')}
        </p>
        <p className="text-sm text-[#757575]">
          {t('searchErrorDescription', { error })}
        </p>
      </div>
    )
  }

  if (candidates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg font-semibold text-[#16252d] mb-2">
          {t('noCandidatesFoundSearch')}
        </p>
        <p className="text-sm text-[#757575]">
          {t('noCandidatesDescriptionSearch')}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="mb-4 sm:mb-6">
        <p className="text-sm sm:text-base font-medium text-[#16252d]">
          {t('candidatesFound', { count: candidates.length, plural: candidates.length === 1 ? '' : 's', search: searchQuery })}
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
        {candidates.map((candidate) => (
          <div key={candidate.id} className="flex flex-col items-center">
            <Link href={`/candidates/${candidate.id}`} className="w-full" locale={locale}>
              <CandidateCard
                name={`${candidate.firstName} ${candidate.lastName}`}
                jobTitle={candidate.jobTitle}
                experience={formatExperience(candidate.experienceYears)}
                nationality={candidate.nationality}
                nationalityFlag={getNationalityFlag(candidate.nationality)}
                location={candidate.location}
                profileImage={candidate.profilePictureUrl ?? null}
                firstName={candidate.firstName}
                lastName={candidate.lastName}
                billingClass={candidate.billingClass}
              />
            </Link>
            <AddToInterviewButton candidate={candidate} variant="outline" />
          </div>
        ))}
      </div>
    </>
  )
}

