import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { HomepageNavbar } from '@/components/homepage/Navbar'
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
import { cn } from '@/lib/utils'
import { getServerSideURL } from '@/utilities/getURL'

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

  if (isNaN(candidateId)) {
    return {
      title: 'Candidate Not Found | Ready to Work',
      description: 'The requested candidate profile could not be found.',
    }
  }

  const candidate = await getCandidateById(candidateId)

  if (!candidate) {
    return {
      title: 'Candidate Not Found | Ready to Work',
      description: 'The requested candidate profile could not be found.',
    }
  }

  const fullName = `${candidate.firstName} ${candidate.lastName}`

  return {
    metadataBase: new URL(getServerSideURL()),
    title: `${fullName} – ${candidate.jobTitle} | Ready to Work`,
    description: `View ${fullName}'s profile. ${candidate.jobTitle} with ${formatExperience(candidate.experienceYears)} experience in ${candidate.location}.`,
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
      <p className="font-inter font-semibold text-[#4644b8] text-[18px] leading-[100%] uppercase tracking-wide">
        {title}
      </p>
      <div className="h-px bg-[#d9d9d9] w-full" />
      <div className="font-inter font-medium text-[#16252d] text-[16px] leading-[100%]">
        {children}
      </div>
    </div>
  )
}

// ============================================================================
// Page Component
// ============================================================================

const DEFAULT_PROFILE = '/assets/aa541dc65d58ecc58590a815ca3bf2c27c889667.webp'

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

  // Fetch similar candidates (excluding current)
  const { candidates: allCandidates } = await getCandidates({ limit: 5 })
  const similarCandidates = allCandidates
    .filter((c) => c.id !== candidateId)
    .slice(0, 4)

  const fullName = `${candidate.firstName} ${candidate.lastName}`
  const profileImage = candidate.profilePictureUrl || DEFAULT_PROFILE
  const flagImage = getNationalityFlag(candidate.nationality)

  // Visa status labels
  const visaStatusLabels: Record<string, string> = {
    active: 'Active Visa',
    expired: 'Expired',
    nearly_expired: 'Nearly Expired',
    none: 'Availability to relocate',
  }

  // Languages as list
  const languagesList = candidate.languages
    .split(',')
    .map((lang) => lang.trim())
    .filter(Boolean)

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <HomepageNavbar />

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
              billingClass={candidate.billingClass}
            />

            {/* Add to Interview Button */}
            <AddToInterviewButton candidate={candidate} />
          </div>

          {/* Right: Info Cards Grid */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 lg:gap-6 content-start">
            {/* Row 1: Visa Status + Saudi Experience */}
            <InfoCard title="Visa Statutes">
              {visaStatusLabels[candidate.visaStatus]}
            </InfoCard>

            <InfoCard title="Years of Experience in Saudi Arabia">
              {candidate.saudiExperience} Years
            </InfoCard>

            {/* Row 2: Job Name + Languages */}
            <InfoCard title="Job Name">{candidate.jobTitle}</InfoCard>

            <InfoCard title="Languages">
              <ul className="list-disc list-inside space-y-1">
                {languagesList.map((lang, idx) => (
                  <li key={idx}>{lang}</li>
                ))}
              </ul>
            </InfoCard>

            {/* Row 3: Tools & Skills (Full width) */}
            <InfoCard title="Tools & Skills" className="sm:col-span-2">
              <ul className="list-disc list-inside space-y-1 text-[16px] leading-[100%]">
                <li>Specialized in {candidate.jobTitle}</li>
                <li>
                  {candidate.experienceYears} years of professional experience
                </li>
                <li>{candidate.saudiExperience} years experience in Saudi Arabia</li>
                {candidate.currentEmployer && (
                  <li>Currently employed at {candidate.currentEmployer}</li>
                )}
                <li>Available for immediate placement</li>
              </ul>
            </InfoCard>
          </div>
        </div>

        {/* Work History Section */}
        <div className="mt-8 sm:mt-10 lg:mt-12">
          <InfoCard title="Work History" className="w-full">
            <div className="space-y-4">
              {/* Work Entry */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <p className="font-semibold text-[#2c2c2c] text-[16px] leading-[100%]">
                    {candidate.jobTitle}
                    {candidate.currentEmployer && (
                      <span className="underline">, {candidate.currentEmployer}</span>
                    )}
                  </p>
                  <p className="text-[12px] leading-[100%] text-[#9a9a9a] uppercase">
                    {candidate.experienceYears} years experience
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-[12px] leading-[100%] text-[#9a9a9a] uppercase">
                  <span>{candidate.experienceYears} years</span>
                  <span>•</span>
                  <span>Full-time</span>
                  <span>•</span>
                  <span>{candidate.location}</span>
                </div>

                <ul className="list-disc list-inside space-y-1 text-[14px] leading-[100%] font-medium text-[#2c2c2c]">
                  <li>Professional {candidate.jobTitle} with proven track record</li>
                  <li>
                    {candidate.saudiExperience} years of experience working in Saudi Arabia
                  </li>
                  <li>Fluent in {candidate.languages}</li>
                  <li>Strong commitment to quality and professionalism</li>
                </ul>
              </div>
            </div>
          </InfoCard>
        </div>

        {/* Education Section */}
        <div className="mt-6 sm:mt-8">
          <InfoCard title="Education" className="w-full">
            <div className="space-y-2">
              <p className="font-semibold text-[#2c2c2c] text-[16px] leading-[100%]">
                Professional Training & Certification
              </p>
              <div className="flex flex-wrap gap-2 text-[12px] leading-[100%] text-[#9a9a9a] uppercase">
                <span>Professional Certification</span>
                <span>•</span>
                <span>{candidate.jobTitle}</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[14px] leading-[100%] font-medium text-[#2c2c2c]">
                <li>Completed professional training in {candidate.jobTitle}</li>
                <li>Certified for work in Saudi Arabia</li>
              </ul>
            </div>
          </InfoCard>
        </div>
      </HomepageSection>

      {/* Similar Candidates Section */}
      {similarCandidates.length > 0 && (
        <HomepageSection className="py-12 sm:py-16 md:py-20 bg-[rgba(175,183,255,0.1)]">
          <h2 className="font-inter font-semibold text-[#16252d] text-[28px] leading-[100%] mb-8 sm:mb-10 md:mb-12">
            Similar Candidates
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
                  profileImage={similar.profilePictureUrl || DEFAULT_PROFILE}
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
