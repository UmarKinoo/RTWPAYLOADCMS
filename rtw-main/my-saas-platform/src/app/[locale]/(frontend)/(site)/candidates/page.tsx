import type { Metadata } from 'next'
import { Link } from '@/i18n/routing'
import { HomepageNavbarWrapper } from '@/components/homepage/NavbarWrapper'
import { CandidatesHero, CandidatesFilter, FindCandidates } from '@/components/candidates'
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
  searchParams: Promise<{ discipline?: string; page?: string }>
}

export default async function CandidatesPage({ params, searchParams }: CandidatesPageProps) {
  const { locale } = await params
  const t = await getTranslations('emptyStates')
  const searchParamsResolved = await searchParams
  const disciplineSlug = searchParamsResolved.discipline
  const page = parseInt(searchParamsResolved.page || '1', 10)

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

  // Fetch candidates from Payload CMS
  const { candidates, totalDocs, totalPages } = await getCandidates({
    limit: 20,
    page,
    disciplineSlug,
  })

  const startIndex = (page - 1) * 20 + 1
  const endIndex = Math.min(page * 20, totalDocs)

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <HomepageNavbarWrapper />
      <CandidatesHero />

      {/* Main Content: Filter Sidebar + Grid */}
      <HomepageSection className="py-6 sm:py-8 md:py-10 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8 xl:gap-10">
          {/* Sidebar - Filter (Desktop: sidebar, Mobile: button that opens sheet) */}
          <aside className="w-full lg:w-[280px] xl:w-[320px] 2xl:w-[350px] flex-shrink-0">
            <CandidatesFilter />
          </aside>

          {/* Main Grid */}
          <div className="flex-1">
            {/* Active Filter Badge */}
            {disciplineName && (
              <div className="mb-4 sm:mb-6">
                <Link
                  href="/candidates"
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#e9d5ff] hover:bg-[#d9c5ef] rounded-lg text-sm font-medium text-[#16252d] transition-colors"
                >
                  <span>Filtered by: {disciplineName}</span>
                  <X className="h-4 w-4" />
                </Link>
              </div>
            )}

            {/* Header Row */}
            <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
              {/* Results Count */}
              <p className="text-sm sm:text-base font-medium text-[#16252d]">
                {totalDocs > 0
                  ? `${totalDocs} candidate${totalDocs === 1 ? '' : 's'}${disciplineName ? ` in ${disciplineName}` : ''}`
                  : t('noCandidates')}
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
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="experience-high">Experience ↓</SelectItem>
                  <SelectItem value="experience-low">Experience ↑</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Candidates Grid */}
            {candidates.length > 0 ? (
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
                  No candidates found
                </p>
                <p className="text-sm text-[#757575]">
                  Try adjusting your filters or check back later.
                </p>
              </div>
            )}

            {/* Login CTA */}
            <div className="flex justify-center mt-6 sm:mt-8">
              <Button
                className="bg-[#4644b8] hover:bg-[#3a3aa0] text-white rounded-full h-10 sm:h-11 px-5 sm:px-8 text-sm sm:text-base font-bold uppercase"
              >
                Login to unlock full access
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
