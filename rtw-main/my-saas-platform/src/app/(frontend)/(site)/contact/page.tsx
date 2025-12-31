import type { Metadata } from 'next'
import { HomepageNavbar } from '@/components/homepage/Navbar'
import { ContactHero, ContactIntro, ContactForm } from '@/components/contact'
import { Newsletter } from '@/components/homepage/blocks/Newsletter'
import { Footer } from '@/components/homepage/blocks/Footer'

export const metadata: Metadata = {
  title: 'Contact Us | Ready to Work',
  description:
    "Get in touch with Ready to Work. We'd love to hear from you! Whether you have a question, feedback, or just want to say hello, feel free to reach out.",
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <HomepageNavbar />
      <ContactHero />
      <ContactIntro />
      <ContactForm />
      <Newsletter />
      <Footer />
    </div>
  )
}

