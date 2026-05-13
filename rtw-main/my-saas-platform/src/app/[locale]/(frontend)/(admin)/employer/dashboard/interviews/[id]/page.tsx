import { redirect } from 'next/navigation'

type LegacyInterviewLinkPageProps = {
  params: Promise<{ locale: string; id: string }>
}

/**
 * Legacy notification links used `/employer/dashboard/interviews/:id` (no matching UI).
 * Redirects to the dashboard interviews view with highlight.
 */
export default async function LegacyEmployerInterviewLinkPage({
  params,
}: LegacyInterviewLinkPageProps) {
  const { locale, id } = await params
  redirect(
    `/${locale}/employer/dashboard?view=interviews&interviewId=${encodeURIComponent(id)}`,
  )
}
