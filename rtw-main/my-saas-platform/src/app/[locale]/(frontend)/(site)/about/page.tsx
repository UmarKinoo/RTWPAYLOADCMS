import type { Metadata } from 'next'
import { HomepageNavbarWrapper } from '@/components/homepage/NavbarWrapper'
import { AboutHero, AboutIntro, OurWork, HowItWorks, ContactSection } from '@/components/about'
import { Newsletter } from '@/components/homepage/blocks/Newsletter'
import { Footer } from '@/components/homepage/blocks/Footer'
import { getLocale } from 'next-intl/server'
import { generateMeta } from '@/utilities/generateMeta'
import { getPageBySlug } from '@/utilities/getPageBySlug'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const aboutPage = await getPageBySlug('about')
  return generateMeta({ doc: aboutPage, path: `${locale}/about` })
}

export default async function AboutPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <HomepageNavbarWrapper />
      <AboutHero />
      <AboutIntro />
      <OurWork />
      <HowItWorks />
      <ContactSection />
      <Newsletter />
      <Footer />
    </div>
  )
}






