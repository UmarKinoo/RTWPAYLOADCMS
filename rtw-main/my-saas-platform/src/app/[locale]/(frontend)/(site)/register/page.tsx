import dynamic from 'next/dynamic'
import { Footer } from '@/components/homepage/blocks/Footer'
import { getLocale, getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { RegistrationWizardFallback } from '@/components/candidate/RegistrationWizardFallback'
import { getServerSideURL } from '@/utilities/getURL'

const RegistrationWizard = dynamic(
  () => import('@/components/candidate/RegistrationWizard').then((mod) => mod.RegistrationWizard),
  {
    loading: () => <RegistrationWizardFallback />,
    ssr: true,
  }
)

const STEP_ALIASES: Record<string, number> = {
  account: 1,
  personal: 2,
  personalinfo: 2,
  jobrole: 3,
  job: 3,
  skill: 3,
  skills: 3,
  experience: 4,
  location: 5,
  locationvisa: 5,
  review: 6,
}

function parseInitialStep(raw: string | string[] | undefined): number | undefined {
  if (raw == null) return undefined
  const value = Array.isArray(raw) ? raw[0] : raw
  if (!value) return undefined
  const asNumber = Number.parseInt(value, 10)
  if (Number.isFinite(asNumber) && asNumber >= 1 && asNumber <= 6) return asNumber
  return STEP_ALIASES[value.trim().toLowerCase().replace(/[\s_-]+/g, '')]
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations('registration')
  const baseUrl = getServerSideURL().replace(/\/$/, '')
  return {
    metadataBase: new URL(baseUrl),
    title: t('title'),
    description: t('steps.account.description'),
    alternates: { canonical: `${baseUrl}/${locale}/register` },
  }
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string | string[] }>
}) {
  const sp = await searchParams
  const initialStep = parseInitialStep(sp.step)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <RegistrationWizard initialStep={initialStep} />
      <Footer />
    </div>
  )
}
