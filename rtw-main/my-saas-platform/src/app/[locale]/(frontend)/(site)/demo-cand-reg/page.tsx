import { getLocale, getTranslations } from 'next-intl/server'
import { getServerSideURL } from '@/utilities/getURL'
import type { Metadata } from 'next'
import { DemoCandRegContent } from './DemoCandRegContent'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations('demoCandReg')
  const baseUrl = getServerSideURL().replace(/\/$/, '')
  return {
    metadataBase: new URL(baseUrl),
    title: t('pageTitle'),
    description: t('pageDescription'),
    alternates: { canonical: `${baseUrl}/${locale}/demo-cand-reg` },
  }
}

export default function DemoCandRegPage() {
  return <DemoCandRegContent />
}
