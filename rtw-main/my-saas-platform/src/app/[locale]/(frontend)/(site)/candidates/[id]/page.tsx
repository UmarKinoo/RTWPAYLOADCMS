import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Link } from '@/i18n/routing'
import { HomepageNavbarWrapper } from '@/components/homepage/NavbarWrapper'
import { Newsletter } from '@/components/homepage/blocks/Newsletter'
import { Footer } from '@/components/homepage/blocks/Footer'
import { HomepageSection } from '@/components/homepage/HomepageSection'
import { CandidateCard } from '@/components/homepage/blocks/Candidates'
import { AddToInterviewButton } from '@/components/employer/AddToInterviewButton'
import {
  getCandidateById,
  getCandidates,
} from '@/lib/payload/candidates'
import { formatExperience, getNationalityFlag } from '@/lib/utils/candidate-utils'
import { getCurrentUserType } from '@/lib/currentUserType'
import { cn } from '@/lib/utils'
import { getServerSideURL } from '@/utilities/getURL'
import { Button } from '@/components/ui/button'
import { getLocale, getTranslations } from 'next-intl/server'

// ============================================================================
// Types
// ============================================================================

type Args = {
  params: Promise<{
    id: string
  }>
}

// ============================================================================
// Metadata
// ============================================================================

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { id } = await paramsPromise
  const candidateId = parseInt(id, 10)
  const t = await getTranslations('candidateDetail')

  if (isNaN(candidateId)) {
    return {
      title: t('notFoundTitle'),
      description: t('notFoundDescription'),
    }
  }

  const candidate = await getCandidateById(candidateId)

  if (!candidate) {
    return {
      title: t('notFoundTitle'),
      description: t('notFoundDescription'),
    }
  }

  const fullName = `${candidate.firstName} ${candidate.lastName}`
  const locale = await getLocale()
  const baseUrl = getServerSideURL().replace(/\/$/, '')

  return {
    metadataBase: new URL(baseUrl),
    title: `${fullName} – ${candidate.jobTitle} | Ready to Work`,
    description: `View ${fullName}'s profile. ${candidate.jobTitle} with ${formatExperience(candidate.experienceYears)} experience in ${candidate.location}.`,
    alternates: { canonical: `${baseUrl}/${locale}/candidates/${id}` },
  }
}

// ============================================================================
// Info Card Component
// ============================================================================

interface InfoCardProps {
  title: string
  children: React.ReactNode
  className?: string
}

function InfoCard({ title, children, className }: InfoCardProps) {
  return (
    <div
      className={cn(
        'bg-white border border-[#d9d9d9] rounded-2xl p-5 sm:p-6 flex flex-col gap-3',
        className,
      )}
    >
      <p className="font-inter font-semibold text-[#4644b8] text-base sm:text-lg leading-[100%] uppercase tracking-wide">
        {title}
      </p>
      <div className="h-px bg-[#d9d9d9] w-full" />
      <div className="font-inter font-medium text-[#16252d] text-sm sm:text-base leading-[140%]">
        {children}
      </div>
    </div>
  )
}

// ============================================================================
// Page Component
// ============================================================================

export default async function CandidateDetailPage({ params: paramsPromise }: Args) {
  const { id } = await paramsPromise
  const candidateId = parseInt(id, 10)

  if (isNaN(candidateId)) {
    notFound()
  }

  const candidate = await getCandidateById(candidateId)

  if (!candidate) {
    notFound()
  }

  const userType = await getCurrentUserType()
  const hasEmployerAccess = userType?.kind === 'employer'

  // Fetch similar candidates only when employer (for "Similar Candidates" block)
  const { candidates: allCandidates } = await getCandidates({ limit: 5 })
  const similarCandidates = hasEmployerAccess
    ? allCandidates.filter((c) => c.id !== candidateId).slice(0, 4)
    : []

  const fullName = `${candidate.firstName} ${candidate.lastName}`
  const profileImage = candidate.profilePictureUrl ?? null
  const flagImage = getNationalityFlag(candidate.nationality)
  const t = await getTranslations('candidateDetail')

  // Visa status labels
  const visaStatusLabels: Record<string, string> = {
    active: t('visaActive'),
    expired: t('visaExpired'),
    nearly_expired: t('visaNearlyExpired'),
    none: t('visaNone'),
  }

  // Languages as list
  const languagesList = candidate.languages
    .split(',')
    .map((lang) => lang.trim())
    .filter(Boolean)

  // Locked view for non-employers: teaser + CTA only
  if (!hasEmployerAccess) {
    const t = await getTranslations('candidatesPage')
    return (
      <div className="min-h-screen bg-white overflow-x-hidden">
        <HomepageNavbarWrapper />
        <HomepageSection className="pt-28 sm:pt-32 md:pt-36 lg:pt-40 pb-12 sm:pb-16 md:pb-20">
          <div className="flex flex-col items-center justify-center max-w-lg mx-auto text-center py-12">
            <CandidateCard
              name={fullName}
              jobTitle={candidate.jobTitle}
              experience={formatExperience(candidate.experienceYears)}
              nationality={candidate.nationality}
              nationalityFlag={flagImage}
              location={candidate.location}
              profileImage={profileImage}
              firstName={candidate.firstName}
              lastName={candidate.lastName}
              billingClass={candidate.billingClass}
              locked
              displayLabel={candidate.jobTitle}
            />
            <div className="mt-8 space-y-4">
              <p className="text-base sm:text-lg font-medium text-[#16252d]">
                {t('employerOnlyViewCandidates')}
              </p>
              <Link href="/employer/register">
                <Button className="bg-[#4644b8] hover:bg-[#3a3aa0] text-white rounded-full h-11 px-8 text-sm sm:text-base font-bold uppercase cursor-pointer">
                  {t('signInAsEmployer')}
                </Button>
              </Link>
            </div>
          </div>
        </HomepageSection>
        <Newsletter />
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <HomepageNavbarWrapper />

      {/* Main Content */}
      <HomepageSection className="pt-28 sm:pt-32 md:pt-36 lg:pt-40 pb-12 sm:pb-16 md:pb-20">
        {/* Top Section: Candidate Card + Info Cards */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 xl:gap-10">
          {/* Left: Candidate Card + Button */}
          <div className="flex flex-col items-center lg:items-start w-full lg:w-auto">
            <CandidateCard
              name={fullName}
              jobTitle={candidate.jobTitle}
              experience={formatExperience(candidate.experienceYears)}
              nationality={candidate.nationality}
              nationalityFlag={flagImage}
              location={candidate.location}
              profileImage={profileImage}
              firstName={candidate.firstName}
              lastName={candidate.lastName}
              billingClass={candidate.billingClass}
            />

            {/* Add to Interview Button */}
            <AddToInterviewButton candidate={candidate} />
          </div>

          {/* Right: Info Cards Grid */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 lg:gap-6 content-start">
            {/* Row 1: Visa Status + Saudi Experience */}
            <InfoCard title={t('visaStatutes')}>
              {visaStatusLabels[candidate.visaStatus]}
            </InfoCard>

            <InfoCard title={t('yearsInSaudi')}>
              {candidate.saudiExperience} {t('yearsSuffix')}
            </InfoCard>

            {/* Row 2: Job Name + Languages */}
            <InfoCard title={t('jobName')}>{candidate.jobTitle}</InfoCard>

            <InfoCard title={t('languages')}>
              <ul className="list-disc list-inside space-y-1">
                {languagesList.map((lang, idx) => (
                  <li key={idx}>{lang}</li>
                ))}
              </ul>
            </InfoCard>

            {/* Row 3: Tools & Skills (Full width) */}
            <InfoCard title={t('toolsAndSkills')} className="sm:col-span-2">
              <ul className="list-disc list-inside space-y-1 text-sm sm:text-base leading-[140%]">
                <li>{t('specializedIn')} {candidate.jobTitle}</li>
                <li>
                  {candidate.experienceYears} {t('yearsProfessional')}
                </li>
                <li>{candidate.saudiExperience} {t('yearsSaudi')}</li>
                {candidate.currentEmployer && (
                  <li>{t('currentlyEmployedAt')} {candidate.currentEmployer}</li>
                )}
                <li>{t('availableImmediate')}</li>
              </ul>
            </InfoCard>
          </div>
        </div>

        {/* Work History Section */}
        <div className="mt-8 sm:mt-10 lg:mt-12">
          <InfoCard title={t('workHistory')} className="w-full">
            <div className="space-y-4">
              {/* Work Entry */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <p className="font-semibold text-[#2c2c2c] text-sm sm:text-base leading-[140%]">
                    {candidate.jobTitle}
                    {candidate.currentEmployer && (
                      <span className="underline">, {candidate.currentEmployer}</span>
                    )}
                  </p>
                  <p className="text-xs sm:text-sm leading-[140%] text-[#9a9a9a] uppercase">
                    {candidate.experienceYears} {t('yearsExperience')}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-xs sm:text-sm leading-[140%] text-[#9a9a9a] uppercase">
                  <span>{candidate.experienceYears} {t('yearsSuffix')}</span>
                  <span>•</span>
                  <span>{t('fullTime')}</span>
                  <span>•</span>
                  <span>{candidate.location}</span>
                </div>

                <ul className="list-disc list-inside space-y-1 text-sm sm:text-base leading-[140%] font-medium text-[#2c2c2c]">
                  <li>{t('professionalWith', { jobTitle: candidate.jobTitle })}</li>
                  <li>
                    {candidate.saudiExperience} {t('yearsWorkingSaudi')}
                  </li>
                  <li>{t('fluentIn')} {candidate.languages}</li>
                  <li>{t('strongCommitment')}</li>
                </ul>
              </div>
            </div>
          </InfoCard>
        </div>

        {/* Education Section */}
        <div className="mt-6 sm:mt-8">
          <InfoCard title={t('education')} className="w-full">
            <div className="space-y-2">
              <p className="font-semibold text-[#2c2c2c] text-sm sm:text-base leading-[140%]">
                {t('professionalTraining')}
              </p>
              <div className="flex flex-wrap gap-2 text-xs sm:text-sm leading-[140%] text-[#9a9a9a] uppercase">
                <span>{t('professionalCertification')}</span>
                <span>•</span>
                <span>{candidate.jobTitle}</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-sm sm:text-base leading-[140%] font-medium text-[#2c2c2c]">
                <li>{t('completedTraining', { jobTitle: candidate.jobTitle })}</li>
                <li>{t('certifiedSaudi')}</li>
              </ul>
            </div>
          </InfoCard>
        </div>
      </HomepageSection>

      {/* Similar Candidates Section */}
      {similarCandidates.length > 0 && (
        <HomepageSection className="py-12 sm:py-16 md:py-20 bg-[rgba(175,183,255,0.1)]">
          <h2 className="font-inter font-semibold text-[#16252d] text-xl sm:text-2xl md:text-3xl leading-[120%] mb-6 sm:mb-8 md:mb-10 lg:mb-12">
            {t('similarCandidates')}
          </h2>

          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
            {similarCandidates.map((similar) => (
              <a
                key={similar.id}
                href={`/candidates/${similar.id}`}
                className="block hover:opacity-90 transition-opacity"
              >
                <CandidateCard
                  name={`${similar.firstName} ${similar.lastName}`}
                  jobTitle={similar.jobTitle}
                  experience={formatExperience(similar.experienceYears)}
                  nationality={similar.nationality}
                  nationalityFlag={getNationalityFlag(similar.nationality)}
                  location={similar.location}
                  profileImage={similar.profilePictureUrl ?? null}
                  firstName={similar.firstName}
                  lastName={similar.lastName}
                  billingClass={similar.billingClass}
                />
              </a>
            ))}
          </div>
        </HomepageSection>
      )}

      <Newsletter />
      <Footer />
    </div>
  )
}
