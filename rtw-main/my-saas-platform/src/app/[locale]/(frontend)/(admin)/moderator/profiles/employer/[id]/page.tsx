import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { getCurrentUserType } from '@/lib/currentUserType'
import { redirectToLogin, redirectToDashboard } from '@/lib/redirects'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { Employer } from '@/payload-types'
import { ArrowLeft, Building2, CreditCard, Globe, Mail, MapPin, Phone, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export const dynamic = 'force-dynamic'

type PageProps = { params: Promise<{ id: string; locale?: string }> }

export default async function ModeratorEmployerProfilePage({ params }: PageProps) {
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

  let employer: Employer | null = null
  try {
    employer = await payload.findByID({
      collection: 'employers',
      id,
      depth: 1,
      overrideAccess: true,
    })
  } catch {
    notFound()
  }

  if (!employer) notFound()

  const creditsInterview = employer.wallet?.interviewCredits ?? 0
  const creditsContact = employer.wallet?.contactUnlockCredits ?? 0

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
          <Building2 className="h-7 w-7" aria-hidden />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[#16252d] sm:text-2xl">
            {employer.companyName}
          </h1>
          <p className="mt-1 text-sm text-[#757575]">Employer profile · ID {employer.id}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-[#e5e5e5] lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4 text-[#4644b8]" aria-hidden />
              Company & contacts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#757575]">
                  Responsible person
                </p>
                <p className="mt-0.5 text-[#16252d]">{employer.responsiblePerson}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#757575]">Email</p>
                <p className="mt-0.5 flex items-center gap-2 break-all text-[#16252d]">
                  <Mail className="h-4 w-4 shrink-0 text-[#757575]" aria-hidden />
                  {employer.email}
                </p>
              </div>
              {employer.phone && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#757575]">Phone</p>
                  <p className="mt-0.5 flex items-center gap-2 text-[#16252d]">
                    <Phone className="h-4 w-4 shrink-0 text-[#757575]" aria-hidden />
                    {employer.phone}
                    {employer.phoneVerified ? (
                      <span className="rounded bg-green-50 px-1.5 py-0.5 text-xs text-green-800">
                        verified
                      </span>
                    ) : null}
                  </p>
                </div>
              )}
              {employer.website && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#757575]">Website</p>
                  <p className="mt-0.5 flex items-center gap-2">
                    <Globe className="h-4 w-4 shrink-0 text-[#757575]" aria-hidden />
                    <a
                      href={
                        employer.website.startsWith('http')
                          ? employer.website
                          : `https://${employer.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#4644b8] underline-offset-2 hover:underline"
                    >
                      {employer.website}
                    </a>
                  </p>
                </div>
              )}
            </div>
            {(employer.industry || employer.companySize) && (
              <>
                <Separator />
                <div className="grid gap-4 sm:grid-cols-2">
                  {employer.industry && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-[#757575]">
                        Industry
                      </p>
                      <p className="mt-0.5 text-[#16252d]">{employer.industry}</p>
                    </div>
                  )}
                  {employer.companySize && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-[#757575]">
                        Company size
                      </p>
                      <p className="mt-0.5 text-[#16252d]">{employer.companySize}</p>
                    </div>
                  )}
                </div>
              </>
            )}
            {employer.address && (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#757575]">Address</p>
                  <p className="mt-0.5 flex items-start gap-2 text-[#16252d]">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#757575]" aria-hidden />
                    {employer.address}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-[#e5e5e5]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4 text-[#4644b8]" aria-hidden />
              Credits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-lg bg-[#fafafa] p-3">
              <p className="text-xs text-[#757575]">Interview credits</p>
              <p className="text-2xl font-semibold tabular-nums text-[#16252d]">{creditsInterview}</p>
            </div>
            <div className="rounded-lg bg-[#fafafa] p-3">
              <p className="text-xs text-[#757575]">Contact unlock credits</p>
              <p className="text-2xl font-semibold tabular-nums text-[#16252d]">{creditsContact}</p>
            </div>
            <p className="text-xs leading-relaxed text-[#757575]">
              One interview credit is deducted when you approve a pending interview request (if the flow
              uses credits).
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
