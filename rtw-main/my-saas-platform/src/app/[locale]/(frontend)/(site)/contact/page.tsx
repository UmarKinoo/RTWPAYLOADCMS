import type { Metadata } from 'next'
import { HomepageNavbarWrapper } from '@/components/homepage/NavbarWrapper'
import { ContactHero, ContactIntro, ContactInfoAndSocial, ContactForm } from '@/components/contact'
import { Newsletter } from '@/components/homepage/blocks/Newsletter'
import { Footer } from '@/components/homepage/blocks/Footer'
import { generateMeta } from '@/utilities/generateMeta'
import { getPageBySlug } from '@/utilities/getPageBySlug'

export async function generateMetadata(): Promise<Metadata> {
  const contactPage = await getPageBySlug('contact')
  return generateMeta({ doc: contactPage })
}

export default async function ContactPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <HomepageNavbarWrapper />
      <ContactHero />
      <ContactIntro />
      <ContactInfoAndSocial />
      <ContactForm />
      <Newsletter />
      <Footer />
    </div>
  )
}

