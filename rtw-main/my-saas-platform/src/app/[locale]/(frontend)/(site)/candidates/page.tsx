import type { Metadata } from 'next'
import { Link } from '@/i18n/routing'
import { HomepageNavbarWrapper } from '@/components/homepage/NavbarWrapper'
import { CandidatesHero, CandidatesFilter, FindCandidates, CandidateSearchBar } from '@/components/candidates'
import { Newsletter } from '@/components/homepage/blocks/Newsletter'
import { Footer } from '@/components/homepage/blocks/Footer'
import { HomepageSection } from '@/components/homepage/HomepageSection'
import { CandidateCard } from '@/components/homepage/blocks/Candidates'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AddToInterviewButton } from '@/components/employer/AddToInterviewButton'
import { SearchResults } from '@/components/candidates/SearchResults'
import { cn } from '@/lib/utils'
import { getCandidates } from '@/lib/payload/candidates'
import { formatExperience, getNationalityFlag } from '@/lib/utils/candidate-utils'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { X } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

// ============================================================================
// Metadata
// ============================================================================

export const metadata: Metadata = {
  title: 'Candidates | Ready to Work',
  description:
    'Browse our talented candidates. Find skilled workers, specialists, and elite professionals for your team.',
}

// ============================================================================
// Page Component
// ============================================================================

// Default profile image
const DEFAULT_PROFILE = '/assets/aa541dc65d58ecc58590a815ca3bf2c27c889667.webp'

interface CandidatesPageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{
    discipline?: string
    page?: string
    search?: string
    location?: string
    nationality?: string
    billingClass?: string
    experience?: string
    country?: string
    state?: string
    jobType?: string
    category?: string
    subCategory?: string
    skillLevel?: string
    availability?: string
    language?: string
  }>
}

export default async function CandidatesPage({ params, searchParams }: CandidatesPageProps) {
  const { locale } = await params
  const t = await getTranslations('candidatesPage')
  const tEmpty = await getTranslations('emptyStates')
  const searchParamsResolved = await searchParams
  const disciplineSlug = searchParamsResolved.discipline
  const searchQuery = searchParamsResolved.search
  const page = parseInt(searchParamsResolved.page || '1', 10)
  
  // Extract all filter params
  const location = searchParamsResolved.location
  const nationality = searchParamsResolved.nationality
  const billingClass = searchParamsResolved.billingClass
  const experience = searchParamsResolved.experience
  const country = searchParamsResolved.country
  const state = searchParamsResolved.state
  const jobType = searchParamsResolved.jobType
  const discipline = searchParamsResolved.discipline
  const category = searchParamsResolved.category
  const subCategory = searchParamsResolved.subCategory
  const skillLevel = searchParamsResolved.skillLevel
  const availability = searchParamsResolved.availability
  const language = searchParamsResolved.language

  // Get discipline name if filtering by discipline (localized)
  let disciplineName: string | null = null
  if (disciplineSlug) {
    try {
      const payload = await getPayload({ config: configPromise })
      const disciplineResult = await payload.find({
        collection: 'disciplines',
        where: {
          slug: {
            equals: disciplineSlug,
          },
        },
        limit: 1,
      })
      if (disciplineResult.docs.length > 0) {
        const discipline = disciplineResult.docs[0]
        // Use localized name based on current locale
        if (locale === 'ar' && discipline.name_ar) {
          disciplineName = discipline.name_ar
        } else if (locale === 'en' && discipline.name_en) {
          disciplineName = discipline.name_en
        } else {
          // Fallback to name_en or name
          disciplineName = discipline.name_en || discipline.name || null
        }
      }
    } catch (error) {
      console.error('Error fetching discipline:', error)
    }
  }

  // If search query is provided, use client-side search component
  // Otherwise, fetch candidates normally
  const isSearchMode = searchQuery && searchQuery.trim()
  
  let candidates: any[] = []
  let totalDocs = 0
  let totalPages = 1

  if (!isSearchMode) {
    // Regular listing with filters - show all candidates
    const result = await getCandidates({
      limit: 1000, // Show all candidates (increased from 20)
      page: 1, // Always show page 1 when displaying all
      disciplineSlug,
      location,
      nationality,
      billingClass,
      experience,
      country,
      state,
      jobType,
      discipline,
      category,
      subCategory,
      skillLevel,
      availability,
      language,
    })
    candidates = result.candidates
    totalDocs = result.totalDocs
    totalPages = 1 // Single page showing all
  }

  // Show all candidates, so pagination info reflects total count
  const startIndex = 1
  const endIndex = totalDocs

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <HomepageNavbarWrapper />
      <CandidatesHero />

      {/* Candidate Search Bar - Heart of candidate search */}
      <HomepageSection className="py-8 sm:py-10 md:py-12 bg-gradient-to-b from-white to-gray-50/30">
        <CandidateSearchBar initialValue={searchQuery || ''} />
      </HomepageSection>

      {/* Main Content: Filter Sidebar + Grid */}
      <HomepageSection className="py-6 sm:py-8 md:py-10 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8 xl:gap-10">
          {/* Sidebar - Filter (Desktop: sidebar, Mobile: button that opens sheet) */}
          <aside className="w-full lg:w-[280px] xl:w-[320px] 2xl:w-[350px] flex-shrink-0">
            <CandidatesFilter />
          </aside>

          {/* Main Grid */}
          <div className="flex-1">
            {/* Active Filter/Search Badge */}
            {(disciplineName || searchQuery || location || nationality || billingClass || experience) && (
              <div className="mb-4 sm:mb-6 flex flex-wrap gap-2">
                {searchQuery && (
                  <Link
                    href="/candidates"
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#e9d5ff] hover:bg-[#d9c5ef] rounded-lg text-sm font-medium text-[#16252d] transition-colors"
                  >
                    <span>{t('searchLabel')}: "{searchQuery}"</span>
                    <X className="h-4 w-4" />
                  </Link>
                )}
                {disciplineName && (
                  <Link
                    href="/candidates"
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#e9d5ff] hover:bg-[#d9c5ef] rounded-lg text-sm font-medium text-[#16252d] transition-colors"
                  >
                    <span>{t('disciplineLabel')}: {disciplineName}</span>
                    <X className="h-4 w-4" />
                  </Link>
                )}
              </div>
            )}

            {/* Header Row */}
            <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
              {/* Results Count */}
              <p className="text-sm sm:text-base font-medium text-[#16252d]">
                {totalDocs > 0
                  ? searchQuery
                    ? t('resultsCountWithSearch', { count: totalDocs, plural: totalDocs === 1 ? '' : 's', search: searchQuery })
                    : disciplineName
                    ? t('resultsCountWithDiscipline', { count: totalDocs, plural: totalDocs === 1 ? '' : 's', discipline: disciplineName })
                    : t('resultsCount', { count: totalDocs, plural: totalDocs === 1 ? '' : 's' })
                  : tEmpty('noCandidates')}
              </p>

              {/* Sort Dropdown */}
              <Select defaultValue="newest">
                <SelectTrigger
                  className={cn(
                    'bg-[#f5f5f5] border-0 rounded-lg',
                    'w-auto min-w-[120px] sm:min-w-[150px]',
                    'h-9 sm:h-10',
                    'px-3 sm:px-4',
                    'text-sm font-medium text-[#16252d]',
                    'focus:ring-2 focus:ring-[#4644b8]',
                  )}
                >
                  <SelectValue placeholder={t('sortBy')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">{t('sortOptions.newest')}</SelectItem>
                  <SelectItem value="oldest">{t('sortOptions.oldest')}</SelectItem>
                  <SelectItem value="experience-high">{t('sortOptions.experienceHigh')}</SelectItem>
                  <SelectItem value="experience-low">{t('sortOptions.experienceLow')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Candidates Grid or Search Results */}
            {isSearchMode ? (
              <SearchResults searchQuery={searchQuery!} locale={locale} />
            ) : candidates.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
                {candidates.map((candidate) => (
                  <div key={candidate.id} className="flex flex-col items-center">
                    {/* Link wrapper for card */}
                    <Link href={`/candidates/${candidate.id}`} className="w-full" locale={locale}>
                      <CandidateCard
                        name={`${candidate.firstName} ${candidate.lastName}`}
                        jobTitle={candidate.jobTitle}
                        experience={formatExperience(candidate.experienceYears)}
                        nationality={candidate.nationality}
                        nationalityFlag={getNationalityFlag(candidate.nationality)}
                        location={candidate.location}
                        profileImage={candidate.profilePictureUrl || DEFAULT_PROFILE}
                        billingClass={candidate.billingClass}
                      />
                    </Link>

                    {/* Add to Interview Button */}
                    <AddToInterviewButton candidate={candidate} variant="outline" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-lg font-semibold text-[#16252d] mb-2">
                  {t('noCandidatesFound')}
                </p>
                <p className="text-sm text-[#757575]">
                  {t('noCandidatesDescription')}
                </p>
              </div>
            )}

            {/* Login CTA */}
            <div className="flex justify-center mt-6 sm:mt-8">
              <Button
                className="bg-[#4644b8] hover:bg-[#3a3aa0] text-white rounded-full h-10 sm:h-11 px-5 sm:px-8 text-sm sm:text-base font-bold uppercase"
              >
                {t('loginToUnlock')}
              </Button>
            </div>
          </div>
        </div>
      </HomepageSection>

      <FindCandidates />
      <Newsletter />
      <Footer />
    </div>
  )
}
