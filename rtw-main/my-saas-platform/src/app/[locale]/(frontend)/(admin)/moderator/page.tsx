import Link from 'next/link'
import { getLocale } from 'next-intl/server'
import { getCurrentUserType } from '@/lib/currentUserType'
import { redirectToLogin, redirectToDashboard } from '@/lib/redirects'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import {
  ArrowRight,
  Building2,
  ClipboardList,
  HelpCircle,
  Inbox,
  LayoutList,
  Shield,
  UserCheck,
  Users,
} from 'lucide-react'
import { moderationQueueWhere } from '@/lib/candidates/profile-status'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function ModeratorDashboardPage() {
  const userType = await getCurrentUserType()
  const locale = await getLocale()

  if (!userType) {
    await redirectToLogin(locale)
    throw new Error('Redirect')
  }

  if (userType.kind !== 'moderator' && userType.kind !== 'admin') {
    await redirectToDashboard(locale)
  }

  const payload = await getPayload({ config: configPromise })

  const [pendingInterviewsResult, pendingCandidatesResult] = await Promise.all([
    payload.find({
      collection: 'interviews',
      where: { status: { equals: 'pending' } },
      limit: 1,
      depth: 0,
    }),
    payload.find({
      collection: 'candidates',
      where: moderationQueueWhere(),
      limit: 1,
      depth: 0,
      overrideAccess: true,
    }),
  ])

  const pendingInterviewCount = pendingInterviewsResult.totalDocs ?? 0
  const pendingCandidateCount = pendingCandidatesResult.totalDocs ?? 0

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8 rounded-xl border border-[#e5e5e5] bg-gradient-to-br from-[#fafbff] via-white to-[#fff9f0] p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#4644b8]">
              Moderator workspace
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-[#16252d] sm:text-3xl">
              Welcome back
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#515151]">
              Approve new candidate profiles before they appear on the website, and review interview
              requests before candidates are notified.
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-[#4644b8]/20 bg-[#ecf2ff] px-4 py-3 text-center">
                <p className="text-xs font-medium uppercase tracking-wide text-[#4644b8]/80">
                  Profiles
                </p>
                <p className="text-3xl font-semibold tabular-nums text-[#16252d]">{pendingCandidateCount}</p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center">
                <p className="text-xs font-medium uppercase tracking-wide text-amber-900/80">
                  Interviews
                </p>
                <p className="text-3xl font-semibold tabular-nums text-[#16252d]">{pendingInterviewCount}</p>
              </div>
            </div>
            <Button
              asChild
              className="w-full bg-[#4644b8] text-white hover:bg-[#3a3aa0] hover:text-white sm:w-auto [&_svg]:text-white"
            >
              <Link href={`/${locale}/moderator/candidates/pending`}>
                Review profiles
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card id="profiles-queue" className="border-[#e5e5e5] shadow-sm scroll-mt-24">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-[#4644b8]">
              <UserCheck className="h-5 w-5" aria-hidden />
              <CardTitle className="text-base">Candidate profiles</CardTitle>
            </div>
            <CardDescription>
              New registrations stay hidden until you approve them for the public candidates page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full border-[#e5e5e5]">
              <Link href={`/${locale}/moderator/candidates/pending#moderator-candidates-pending-list`}>
                <LayoutList className="mr-2 h-4 w-4" aria-hidden />
                Review profiles ({pendingCandidateCount})
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card id="queue" className="border-[#e5e5e5] shadow-sm scroll-mt-24">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-[#4644b8]">
              <Inbox className="h-5 w-5" aria-hidden />
              <CardTitle className="text-base">Interview requests</CardTitle>
            </div>
            <CardDescription>
              Approve or reject employer interview requests before candidates are notified.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full border-[#e5e5e5]">
              <Link href={`/${locale}/moderator/interviews/pending#moderator-pending-list`}>
                <LayoutList className="mr-2 h-4 w-4" aria-hidden />
                Review interviews ({pendingInterviewCount})
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card id="profiles" className="border-[#e5e5e5] shadow-sm scroll-mt-24">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-[#4644b8]">
              <Users className="h-5 w-5" aria-hidden />
              <CardTitle className="text-base">Profiles</CardTitle>
            </div>
            <CardDescription>
              From each request, use &quot;Open full profile&quot; to see employer or candidate details
              on dedicated pages.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-[#515151]">
            <p className="flex items-center gap-2">
              <Building2 className="h-4 w-4 shrink-0 text-[#757575]" aria-hidden />
              Employer: company, contacts, credits
            </p>
            <p className="flex items-center gap-2">
              <Users className="h-4 w-4 shrink-0 text-[#757575]" aria-hidden />
              Candidate: role, location, skill
            </p>
          </CardContent>
        </Card>

        <Card id="workflow" className="border-[#e5e5e5] shadow-sm sm:col-span-2 lg:col-span-1 scroll-mt-24">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-[#4644b8]">
              <ClipboardList className="h-5 w-5" aria-hidden />
              <CardTitle className="text-base">Workflow</CardTitle>
            </div>
            <CardDescription>How interview requests move through the system.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm text-[#515151]">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ecf2ff] text-xs font-semibold text-[#4644b8]">
                  1
                </span>
                <span>Employer requests an interview (pending). Candidate is not notified yet.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ecf2ff] text-xs font-semibold text-[#4644b8]">
                  2
                </span>
                <span>You review the employer message, employer and candidate context, then approve or reject.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ecf2ff] text-xs font-semibold text-[#4644b8]">
                  3
                </span>
                <span>After approval, the candidate is notified and can accept or decline the slot.</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#e5e5e5] bg-white shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-[#757575]" aria-hidden />
            <CardTitle className="text-base text-[#16252d]">On this page</CardTitle>
          </div>
          <CardDescription>
            Anchor shortcuts for quick navigation within the moderator area.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            asChild
            variant="secondary"
            size="sm"
            className="border border-[#e5e5e5] bg-[#f5f5f5] text-[#16252d] hover:bg-[#ebebeb] hover:text-[#16252d]"
          >
            <a href="#queue">#queue</a>
          </Button>
          <Button
            asChild
            variant="secondary"
            size="sm"
            className="border border-[#e5e5e5] bg-[#f5f5f5] text-[#16252d] hover:bg-[#ebebeb] hover:text-[#16252d]"
          >
            <a href="#profiles">#profiles</a>
          </Button>
          <Button
            asChild
            variant="secondary"
            size="sm"
            className="border border-[#e5e5e5] bg-[#f5f5f5] text-[#16252d] hover:bg-[#ebebeb] hover:text-[#16252d]"
          >
            <a href="#workflow">#workflow</a>
          </Button>
          <Button
            asChild
            variant="secondary"
            size="sm"
            className="border border-[#e5e5e5] bg-[#f5f5f5] text-[#16252d] hover:bg-[#ebebeb] hover:text-[#16252d]"
          >
            <Link href={`/${locale}/moderator/interviews/pending#moderator-pending-list`}>
              Pending list anchor
            </Link>
          </Button>
        </CardContent>
      </Card>

      <p className="mt-8 flex items-center gap-2 text-xs text-[#757575]">
        <Shield className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Signed in as moderator — employer and candidate data is shown only to help you make consistent
        approval decisions.
      </p>
    </div>
  )
}
