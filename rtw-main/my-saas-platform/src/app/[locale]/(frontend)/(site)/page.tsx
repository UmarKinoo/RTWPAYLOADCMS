import type { Metadata } from 'next'
import { HomepageNavbarWrapper } from '@/components/homepage/NavbarWrapper'
import { Hero } from '@/components/homepage/blocks/Hero'
import { Candidates } from '@/components/homepage/blocks/Candidates'
import { MajorDisciplines } from '@/components/homepage/blocks/MajorDisciplines'
import { UploadResume } from '@/components/homepage/blocks/UploadResume'
import { Blog } from '@/components/homepage/blocks/Blog'
import { TrustedBy } from '@/components/homepage/blocks/TrustedBy'
import { FAQ } from '@/components/homepage/blocks/FAQ'
import { Newsletter } from '@/components/homepage/blocks/Newsletter'
import { Footer } from '@/components/homepage/blocks/Footer'

export const metadata: Metadata = {
  title: 'Ready to Work | Connect with Talented Candidates',
  description: 'Explore thousands of openings and talented profiles all in one place. Access a wide pool of qualified candidates across all roles and industries.',
}

export default async function Home() {
  return (
    <div className="min-h-screen bg-[#ffffff] overflow-x-hidden">
      <HomepageNavbarWrapper />
      <Hero />
      <Candidates />
      <MajorDisciplines />
      <UploadResume />
      <Blog />
      <TrustedBy />
      <FAQ />
      <Newsletter />
      <Footer />
    </div>
  )
}
