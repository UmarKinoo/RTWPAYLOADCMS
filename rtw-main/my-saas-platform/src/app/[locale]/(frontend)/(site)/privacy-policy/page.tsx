import { HomepageNavbar } from '@/components/homepage/Navbar'
import { Footer } from '@/components/homepage/blocks/Footer'
import { Newsletter } from '@/components/homepage/blocks/Newsletter'
import { PrivacyPolicyContent } from '@/components/privacy-policy/PrivacyPolicyContent'

export const metadata = {
  title: 'Privacy Policy | Ready to Work',
  description: 'Read our privacy policy to understand how we collect, use, and protect your personal data.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <HomepageNavbar />
      <PrivacyPolicyContent />
      <Newsletter />
      <Footer />
    </div>
  )
}

