import { HomepageNavbar } from '@/components/homepage/Navbar'
import { AboutHero, OurWork, HowItWorks, ContactSection } from '@/components/about'
import { Newsletter } from '@/components/homepage/blocks/Newsletter'
import { Footer } from '@/components/homepage/blocks/Footer'

export const metadata = {
  title: 'About Us | Ready to Work',
  description: 'Learn about Ready to Work - your trusted partner for connecting talented candidates with the right employers.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <HomepageNavbar />
      <AboutHero />
      <OurWork />
      <HowItWorks />
      <ContactSection />
      <Newsletter />
      <Footer />
    </div>
  )
}



