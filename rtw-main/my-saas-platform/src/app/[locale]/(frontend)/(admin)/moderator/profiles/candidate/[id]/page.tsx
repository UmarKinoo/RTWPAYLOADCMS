import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { getCurrentUserType } from '@/lib/currentUserType'
import { redirectToLogin, redirectToDashboard } from '@/lib/redirects'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { Candidate, Skill } from '@/payload-types'
import {
  ArrowLeft,
  Briefcase,
  Globe,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export const dynamic = 'force-dynamic'

type PageProps = { params: Promise<{ id: string; locale?: string }> }

export default async function ModeratorCandidateProfilePage({ params }: PageProps) {
  const userType = await getCurrentUserType()
  const locale = await getLocale()

  if (!userType) {
    await redirectToLogin(locale)
    throw new Error('Redirect')
  }

  if (userType.kind !== 'moderator') await redirectToDashboard(locale)

  const { id: rawId } = await params
  const id = Number.parseInt(rawId, 10)
  if (!Number.isFinite(id)) notFound()

  const payload = await getPayload({ config: configPromise })

  let candidate: Candidate | null = null
  try {
    candidate = await payload.findByID({
      collection: 'candidates',
      id,
      depth: 1,
      overrideAccess: true,
    })
  } catch {
    notFound()
  }

  if (!candidate) notFound()

  const skill =
    candidate.primarySkill && typeof candidate.primarySkill === 'object'
      ? (candidate.primarySkill as Skill)
      : null

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" className="-ml-2 text-[#515151]" asChild>
          <Link href={`/${locale}/moderator/interviews/pending`}>
            <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden />
            Back to pending queue
          </Link>
        </Button>
        <Button variant="outline" size="sm" className="border-[#e5e5e5]" asChild>
          <Link href={`/${locale}/moderator`}>Moderator home</Link>
        </Button>
      </div>

      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#ecf2ff] text-[#4644b8]">
          <User className="h-7 w-7" aria-hidden />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[#16252d] sm:text-2xl">
            {candidate.firstName} {candidate.lastName}
          </h1>
          <p className="mt-1 text-sm text-[#757575]">Candidate profile · ID {candidate.id}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-[#e5e5e5] lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="h-4 w-4 text-[#4644b8]" aria-hidden />
              Role & background
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#757575]">Job title</p>
                <p className="mt-0.5 text-[#16252d]">{candidate.jobTitle}</p>
              </div>
              {skill && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#757575]">
                    Primary skill
                  </p>
                  <p className="mt-0.5 flex items-center gap-2 text-[#16252d]">
                    <GraduationCap className="h-4 w-4 shrink-0 text-[#757575]" aria-hidden />
                    {skill.name}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#757575]">
                  Billing class
                </p>
                <p className="mt-0.5 text-[#16252d]">{candidate.billingClass ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#757575]">
                  Experience (years)
                </p>
                <p className="mt-0.5 text-[#16252d]">{candidate.experienceYears}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#757575]">
                  Saudi experience (years)
                </p>
                <p className="mt-0.5 text-[#16252d]">{candidate.saudiExperience}</p>
              </div>
            </div>
            <Separator />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#757575]">Email</p>
                <p className="mt-0.5 flex items-center gap-2 break-all text-[#16252d]">
                  <Mail className="h-4 w-4 shrink-0 text-[#757575]" aria-hidden />
                  {candidate.email}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#757575]">Phone</p>
                <p className="mt-0.5 flex items-center gap-2 text-[#16252d]">
                  <Phone className="h-4 w-4 shrink-0 text-[#757575]" aria-hidden />
                  {candidate.phone}
                  {candidate.phoneVerified ? (
                    <span className="rounded bg-green-50 px-1.5 py-0.5 text-xs text-green-800">
                      verified
                    </span>
                  ) : null}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-medium uppercase tracking-wide text-[#757575]">Location</p>
                <p className="mt-0.5 flex items-center gap-2 text-[#16252d]">
                  <MapPin className="h-4 w-4 shrink-0 text-[#757575]" aria-hidden />
                  {candidate.location}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#757575]">
                  Nationality
                </p>
                <p className="mt-0.5 flex items-center gap-2 text-[#16252d]">
                  <Globe className="h-4 w-4 shrink-0 text-[#757575]" aria-hidden />
                  {candidate.nationality}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#757575]">
                  Languages
                </p>
                <p className="mt-0.5 text-[#16252d]">{candidate.languages}</p>
              </div>
            </div>
            {candidate.aboutMe && (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#757575]">About</p>
                  <p className="mt-2 whitespace-pre-wrap text-[#515151]">{candidate.aboutMe}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-[#e5e5e5]">
          <CardHeader>
            <CardTitle className="text-base text-[#16252d]">Visa & availability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-[#515151]">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[#757575]">Visa status</p>
              <p className="mt-0.5 capitalize">{candidate.visaStatus}</p>
            </div>
            {candidate.currentEmployer && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#757575]">
                  Current employer
                </p>
                <p className="mt-0.5">{candidate.currentEmployer}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[#757575]">
                Available from
              </p>
              <p className="mt-0.5">{new Date(candidate.availabilityDate).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
