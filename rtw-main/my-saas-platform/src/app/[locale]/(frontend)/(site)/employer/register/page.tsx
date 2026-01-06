import type { Metadata } from 'next'
import { HomepageNavbar } from '@/components/homepage/Navbar'
import { EmployerRegistrationForm } from '@/components/employer'
import { Footer } from '@/components/homepage/blocks/Footer'
import { ImageWithSkeleton } from '@/components/homepage/ImageWithSkeleton'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export const metadata: Metadata = {
  title: 'Employer Registration | Ready to Work',
  description: 'Register your company and join our club. Create your employer account to start hiring talented candidates.',
}

export default function EmployerRegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HomepageNavbar />
      
      <main className="flex-1 pt-24 sm:pt-28 md:pt-32 pb-8 sm:pb-12">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 2xl:px-[95px]">
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 md:gap-8 lg:gap-12 items-start">
            {/* Left Side - Image (hidden on mobile, shown on desktop) */}
            <div className="hidden lg:block relative w-full">
              <div className="relative w-full aspect-[3/4] lg:aspect-[4/5] rounded-2xl overflow-hidden shadow-xl">
                <div
                  className="absolute inset-0"
                  style={{
                    maskImage: `url('/assets/9067d496e1f10f37d480e3dc99e0dd3a6af0fb6c.svg')`,
                    WebkitMaskImage: `url('/assets/9067d496e1f10f37d480e3dc99e0dd3a6af0fb6c.svg')`,
                    maskSize: 'contain',
                    maskPosition: 'center',
                    maskRepeat: 'no-repeat',
                  }}
                >
                  <ImageWithSkeleton
                    src="/assets/1c9081eb8a1bf7184d09a0304d1ffbda9a8d0678.webp"
                    alt="Professional business person"
                    fill
                    objectFit="cover"
                  />
                </div>
              </div>
            </div>

            {/* Right Side - Registration Form */}
            <div className="w-full flex justify-center lg:justify-start">
              <Card className="w-full bg-white shadow-xl border-0 p-6 sm:p-8 md:p-10">
                <EmployerRegistrationForm />
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
