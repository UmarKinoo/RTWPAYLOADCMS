import { HomepageNavbar } from '@/components/homepage/Navbar'
import { Footer } from '@/components/homepage/blocks/Footer'
import { Newsletter } from '@/components/homepage/blocks/Newsletter'
import { TermsAndConditionsContent } from '@/components/terms-and-conditions/TermsAndConditionsContent'

export const metadata = {
  title: 'Terms and Conditions | Ready to Work',
  description: 'Read our terms and conditions to understand the rules and regulations for using our platform.',
}

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <HomepageNavbar />
      <TermsAndConditionsContent />
      <Newsletter />
      <Footer />
    </div>
  )
}

