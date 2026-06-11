'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { CandidateCard } from '@/components/homepage/blocks/CandidatesClient'
import { AddToInterviewButton } from '@/components/employer/AddToInterviewButton'
import { formatExperience, getNationalityFlag } from '@/lib/utils/candidate-utils'
import { Link } from '@/i18n/routing'
import type { CandidateListItem } from '@/types/candidate'
import { searchCandidates } from '@/lib/employer/search'
import { CandidatesPagination } from '@/components/candidates/CandidatesPagination'
import { CANDIDATES_PER_PAGE } from '@/lib/candidates/profile-status'

interface SearchResultsProps {
  searchQuery: string
  locale: string
  currentPage: number
  searchParams: Record<string, string | undefined>
}

export function SearchResults({
  searchQuery,
  locale,
  currentPage,
  searchParams,
}: SearchResultsProps) {
  const t = useTranslations('candidatesPage')
  const [candidates, setCandidates] = useState<CandidateListItem[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!searchQuery.trim()) {
      setIsLoading(false)
      setCandidates([])
      setTotal(0)
      setTotalPages(0)
      return
    }

    let cancelled = false

    const performSearch = async () => {
      setIsLoading(true)
      setError(null)
      setCandidates([])

      try {
        const result = await searchCandidates(searchQuery.trim(), {
          page: currentPage,
          limit: CANDIDATES_PER_PAGE,
        })
        if (cancelled) return
        setCandidates(result.candidates || [])
        setTotal(result.total)
        setTotalPages(result.totalPages)
      } catch (err: unknown) {
        if (cancelled) return
        console.error('Search error:', err)
        const errorMessage = err instanceof Error ? err.message : 'Failed to search candidates'
        setError(
          errorMessage.includes('Unauthorized')
            ? 'Please log in as an employer to search candidates'
            : errorMessage.includes('not yet supported')
              ? 'You do not have permission to search'
              : errorMessage,
        )
        setCandidates([])
        setTotal(0)
        setTotalPages(0)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    performSearch()

    return () => {
      cancelled = true
    }
    // searchQuery + currentPage only — do not add `t` (unstable reference causes infinite re-fetch)
  }, [searchQuery, currentPage])

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
        <p className="text-lg font-semibold text-[#16252d] mb-2">{t('searchError')}</p>
        <p className="text-sm text-[#757575]">{t('searchErrorDescription', { error })}</p>
      </div>
    )
  }

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg font-semibold text-[#16252d] mb-2">{t('noCandidatesFoundSearch')}</p>
        <p className="text-sm text-[#757575]">{t('noCandidatesDescriptionSearch')}</p>
      </div>
    )
  }

  return (
    <>
      <div className="mb-4 sm:mb-6">
        <p className="text-sm sm:text-base font-medium text-[#16252d]">
          {t('candidatesFound', {
            count: total,
            plural: total === 1 ? '' : 's',
            search: searchQuery,
          })}
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
      <CandidatesPagination
        page={currentPage}
        totalPages={totalPages}
        searchParams={searchParams}
        locale={locale}
        previousLabel={t('paginationPrevious')}
        nextLabel={t('paginationNext')}
      />
    </>
  )
}
