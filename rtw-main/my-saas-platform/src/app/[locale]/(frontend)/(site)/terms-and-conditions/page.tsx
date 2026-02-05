import type { Metadata } from 'next'
import { HomepageNavbarWrapper } from '@/components/homepage/NavbarWrapper'
import { Footer } from '@/components/homepage/blocks/Footer'
import { Newsletter } from '@/components/homepage/blocks/Newsletter'
import { TermsAndConditionsContent } from '@/components/terms-and-conditions/TermsAndConditionsContent'
import { getLocale } from 'next-intl/server'
import { generateMeta } from '@/utilities/generateMeta'
import { getPageBySlug } from '@/utilities/getPageBySlug'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const termsPage = await getPageBySlug('terms-and-conditions')
  return generateMeta({ doc: termsPage, path: `${locale}/terms-and-conditions` })
}

export default async function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <HomepageNavbarWrapper />
      <TermsAndConditionsContent />
      <Newsletter />
      <Footer />
    </div>
  )
}

