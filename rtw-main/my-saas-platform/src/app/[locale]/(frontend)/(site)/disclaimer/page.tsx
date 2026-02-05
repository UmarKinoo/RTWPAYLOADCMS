import type { Metadata } from 'next'
import { HomepageNavbarWrapper } from '@/components/homepage/NavbarWrapper'
import { Footer } from '@/components/homepage/blocks/Footer'
import { Newsletter } from '@/components/homepage/blocks/Newsletter'
import { DisclaimerContent } from '@/components/disclaimer/DisclaimerContent'
import { getLocale } from 'next-intl/server'
import { generateMeta } from '@/utilities/generateMeta'
import { getPageBySlug } from '@/utilities/getPageBySlug'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const disclaimerPage = await getPageBySlug('disclaimer')
  return generateMeta({ doc: disclaimerPage, path: `${locale}/disclaimer` })
}

export default async function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <HomepageNavbarWrapper />
      <DisclaimerContent />
      <Newsletter />
      <Footer />
    </div>
  )
}
