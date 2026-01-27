import type { Metadata } from 'next'
import { HomepageNavbarWrapper } from '@/components/homepage/NavbarWrapper'
import { Hero } from '@/components/homepage/blocks/Hero'
import { getCurrentUserType } from '@/lib/currentUserType'
import { Candidates } from '@/components/homepage/blocks/Candidates'
import { MajorDisciplines } from '@/components/homepage/blocks/MajorDisciplines'
import { UploadResume } from '@/components/homepage/blocks/UploadResume'
import { Blog } from '@/components/homepage/blocks/Blog'
import { TrustedBy } from '@/components/homepage/blocks/TrustedBy'
import { FAQ } from '@/components/homepage/blocks/FAQ'
import { Newsletter } from '@/components/homepage/blocks/Newsletter'
import { Footer } from '@/components/homepage/blocks/Footer'
import { generateMeta } from '@/utilities/generateMeta'
import { getPageBySlug } from '@/utilities/getPageBySlug'

export async function generateMetadata(): Promise<Metadata> {
  const homepage = await getPageBySlug('home')
  return generateMeta({ doc: homepage })
}

export default async function Home() {
  const userType = await getCurrentUserType()
  const showSmartSearch = userType?.kind === 'employer'
  return (
    <div className="min-h-screen bg-[#ffffff] overflow-x-hidden">
      <HomepageNavbarWrapper />
      <Hero showSmartSearch={showSmartSearch} />
      <TrustedBy />
      <Candidates />
      <MajorDisciplines />
      <UploadResume />
      <Blog />
      <FAQ />
      <Newsletter />
      <Footer />
    </div>
  )
}
