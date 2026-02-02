import dynamic from 'next/dynamic'
import { Footer } from '@/components/homepage/blocks/Footer'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { RegistrationWizardFallback } from '@/components/candidate/RegistrationWizardFallback'

const RegistrationWizard = dynamic(
  () => import('@/components/candidate/RegistrationWizard').then((mod) => mod.RegistrationWizard),
  {
    loading: () => <RegistrationWizardFallback />,
    ssr: true,
  }
)

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('registration')
  return {
    title: t('title'),
    description: t('steps.account.description'),
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
