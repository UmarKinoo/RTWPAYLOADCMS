import type { Metadata } from 'next'
import { HomepageNavbarWrapper } from '@/components/homepage/NavbarWrapper'
import { Footer } from '@/components/homepage/blocks/Footer'
import { Newsletter } from '@/components/homepage/blocks/Newsletter'
import { PrivacyPolicyContent } from '@/components/privacy-policy/PrivacyPolicyContent'
import { getLocale } from 'next-intl/server'
import { generateMeta } from '@/utilities/generateMeta'
import { getPageBySlug } from '@/utilities/getPageBySlug'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const privacyPage = await getPageBySlug('privacy-policy')
  return generateMeta({ doc: privacyPage, path: `${locale}/privacy-policy` })
}

export default async function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <HomepageNavbarWrapper />
      <PrivacyPolicyContent />
      <Newsletter />
      <Footer />
    </div>
  )
}

