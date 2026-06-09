import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { loadReadyBotCandidateDetail } from '@/lib/readybot/dashboardData'
import { CandidateReadyBotDetail } from '@/components/readybot/CandidateReadyBotDetail'

export const dynamic = 'force-dynamic'

type Props = Readonly<{
  params: Promise<{ id: string }>
}>

export default async function ReadyBotCandidatePage({ params }: Props) {
  const { id } = await params
  const locale = await getLocale()
  const data = await loadReadyBotCandidateDetail(id)

  if (!data) notFound()

  return <CandidateReadyBotDetail locale={locale} data={data} />
}
