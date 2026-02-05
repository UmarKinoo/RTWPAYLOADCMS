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

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <RegistrationWizard />
      <Footer />
    </div>
  )
}
