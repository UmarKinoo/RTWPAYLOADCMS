import type { Metadata } from 'next'
import { Link } from '@/i18n/routing'
import { HomepageNavbarWrapper } from '@/components/homepage/NavbarWrapper'
import { CandidatesHero, CandidatesFilter, FindCandidates, CandidateSearchBar, CandidatesPageContent } from '@/components/candidates'
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
import { getCurrentUserType } from '@/lib/currentUserType'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { X } from 'lucide-react'
import { getLocale, getTranslations } from 'next-intl/server'
import { generateMeta } from '@/utilities/generateMeta'
import { getPageBySlug } from '@/utilities/getPageBySlug'

// ============================================================================
// Metadata
// ============================================================================

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const candidatesPage = await getPageBySlug('candidates')
  return generateMeta({ doc: candidatesPage, path: `${locale}/candidates` })
}

// ============================================================================
// Helpers (reduce cognitive complexity of page)
// ============================================================================

async function getDisciplineNameForLocale(
  slug: string | undefined,
  locale: string
): Promise<string | null> {
  if (!slug) return null
  try {
    const payload = await getPayload({ config: configPromise })
    const res = await payload.find({
      collection: 'disciplines',
      where: { slug: { equals: slug } },
      limit: 1,
    })
    const doc = res.docs[0]
    if (!doc) return null
    if (locale === 'ar' && doc.name_ar) return doc.name_ar
    if (locale === 'en' && doc.name_en) return doc.name_en
    return doc.name_en ?? doc.name ?? null
  } catch (err) {
    console.error('Error fetching discipline:', err)
    return null
  }
}

function getResultsCountMessage(params: {
  totalDocs: number
  searchQuery?: string
  disciplineName: string | null
  t: (key: string, vars?: Record<string, string | number>) => string
  tEmpty: (key: string) => string
}): string {
  const { totalDocs, searchQuery, disciplineName, t, tEmpty } = params
  if (totalDocs === 0) return tEmpty('noCandidates')
  const plural = totalDocs === 1 ? '' : 's'
  if (searchQuery) return t('resultsCountWithSearch', { count: totalDocs, plural, search: searchQuery })
  if (disciplineName) return t('resultsCountWithDiscipline', { count: totalDocs, plural, discipline: disciplineName })
  return t('resultsCount', { count: totalDocs, plural })
}

// Default profile image
const DEFAULT_PROFILE = '/assets/aa541dc65d58ecc58590a815ca3bf2c27c889667.webp'

// ============================================================================
// Sub-components (keep page.tsx complexity low)
// ============================================================================

function ActiveFilterBadges(props: Readonly<{
  disciplineName: string | null
  searchQuery?: string
  showBadges: boolean
  t: (key: string) => string
}>) {
  const { disciplineName, searchQuery, showBadges, t } = props
  if (!showBadges) return null
  return (
    <div className="mb-4 sm:mb-6 flex flex-wrap gap-2">
      {searchQuery && (
        <Link
          href="/candidates"
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#e9d5ff] hover:bg-[#d9c5ef] rounded-lg text-sm font-medium text-[#16252d] transition-colors"
        >
          <span>{t('searchLabel')}: &quot;{searchQuery}&quot;</span>
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
  )
}

function CandidateGridCard(props: Readonly<{
  candidate: any
  hasEmployerAccess: boolean
  locale: string
}>) {
  const { candidate, hasEmployerAccess, locale } = props
  const name = `${candidate.firstName} ${candidate.lastName}`
  const card = (
    <CandidateCard
      name={name}
      jobTitle={candidate.jobTitle}
      experience={formatExperience(candidate.experienceYears)}
      nationality={candidate.nationality}
      nationalityFlag={getNationalityFlag(candidate.nationality)}
      location={candidate.location}
      profileImage={candidate.profilePictureUrl || DEFAULT_PROFILE}
      billingClass={candidate.billingClass}
      locked={!hasEmployerAccess}
      displayLabel={hasEmployerAccess ? undefined : candidate.jobTitle}
    />
  )
  if (hasEmployerAccess) {
    return (
      <div className="flex flex-col items-center">
        <Link href={`/candidates/${candidate.id}`} className="w-full" locale={locale}>
          {card}
        </Link>
        <AddToInterviewButton candidate={candidate} variant="outline" />
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center">
      <Link href="/employer/register" className="w-full" locale={locale}>
        {card}
      </Link>
    </div>
  )
}

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
  const q = await searchParams
  const searchQuery = q.search?.trim() || ''
  const isSearchMode = searchQuery.length > 0

  const disciplineName = await getDisciplineNameForLocale(q.discipline, locale)
  const userType = await getCurrentUserType()
  const hasEmployerAccess = userType?.kind === 'employer'

  let candidates: any[] = []
  let totalDocs = 0
  if (!isSearchMode) {
    const result = await getCandidates({
      limit: 1000,
      page: 1,
      disciplineSlug: q.discipline,
      location: q.location,
      nationality: q.nationality,
      billingClass: q.billingClass,
      experience: q.experience,
      country: q.country,
      state: q.state,
      jobType: q.jobType,
      discipline: q.discipline,
      category: q.category,
      subCategory: q.subCategory,
      skillLevel: q.skillLevel,
      availability: q.availability,
      language: q.language,
    })
    candidates = result.candidates
    totalDocs = result.totalDocs
  }

  const showBadges = Boolean(
    disciplineName || searchQuery || q.location || q.nationality || q.billingClass || q.experience
  )
  const resultsMessage = getResultsCountMessage({
    totalDocs,
    searchQuery: searchQuery || undefined,
    disciplineName,
    t,
    tEmpty,
  })

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <HomepageNavbarWrapper />
      <CandidatesHero />
      <HomepageSection className="py-8 sm:py-10 md:py-12 bg-gradient-to-b from-white to-gray-50/30">
        <CandidateSearchBar initialValue={q.search || ''} />
      </HomepageSection>

      <HomepageSection className="py-6 sm:py-8 md:py-10 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8 xl:gap-10">
          <aside className="w-full lg:w-[280px] xl:w-[320px] 2xl:w-[350px] flex-shrink-0">
            <CandidatesFilter />
          </aside>

          <div className="flex-1">
            <ActiveFilterBadges
              disciplineName={disciplineName}
              searchQuery={searchQuery || undefined}
              showBadges={showBadges}
              t={t}
            />

            <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
              <p className="text-sm sm:text-base font-medium text-[#16252d]">{resultsMessage}</p>
              <Select defaultValue="newest">
                <SelectTrigger
                  className={cn(
                    'bg-[#f5f5f5] border-0 rounded-lg',
                    'w-auto min-w-[120px] sm:min-w-[150px] h-9 sm:h-10 px-3 sm:px-4',
                    'text-sm font-medium text-[#16252d] focus:ring-2 focus:ring-[#4644b8]'
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

            <CandidatesBody
              isSearchMode={isSearchMode}
              searchQuery={searchQuery}
              candidates={candidates}
              hasEmployerAccess={hasEmployerAccess}
              locale={locale}
              t={t}
            />

            {!hasEmployerAccess && (
              <div className="flex flex-col items-center justify-center mt-6 sm:mt-8 p-4 sm:p-6 bg-[#f5f5f5] rounded-xl max-w-lg mx-auto text-center">
                <p className="text-sm sm:text-base font-medium text-[#16252d] mb-3">
                  {t('employerOnlyViewCandidates')}
                </p>
                <Link href="/employer/register" locale={locale}>
                  <Button className="bg-[#4644b8] hover:bg-[#3a3aa0] text-white rounded-full h-10 sm:h-11 px-5 sm:px-8 text-sm sm:text-base font-bold uppercase cursor-pointer">
                    {t('signInAsEmployer')}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </HomepageSection>

      <FindCandidates />
      <CandidatesPageContent />
      <Newsletter />
      <Footer />
    </div>
  )
}

function CandidatesBody(props: Readonly<{
  isSearchMode: boolean
  searchQuery: string
  candidates: any[]
  hasEmployerAccess: boolean
  locale: string
  t: (key: string) => string
}>) {
  const { isSearchMode, searchQuery, candidates, hasEmployerAccess, locale, t } = props
  if (isSearchMode) {
    if (hasEmployerAccess) {
      return <SearchResults searchQuery={searchQuery} locale={locale} />
    }
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center max-w-md mx-auto">
        <p className="text-lg font-semibold text-[#16252d] mb-2">{t('employerOnlySearch')}</p>
        <p className="text-sm text-[#757575] mb-4">{t('employerOnlySearchDescription')}</p>
        <Link href="/employer/register" locale={locale}>
          <Button className="bg-[#4644b8] hover:bg-[#3a3aa0] text-white rounded-lg px-6 py-2.5 font-medium">
            {t('signInAsEmployer')}
          </Button>
        </Link>
      </div>
    )
  }
  if (candidates.length > 0) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
        {candidates.map((c) => (
          <CandidateGridCard
            key={c.id}
            candidate={c}
            hasEmployerAccess={hasEmployerAccess}
            locale={locale}
          />
        ))}
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-lg font-semibold text-[#16252d] mb-2">{t('noCandidatesFound')}</p>
      <p className="text-sm text-[#757575]">{t('noCandidatesDescription')}</p>
    </div>
  )
}
