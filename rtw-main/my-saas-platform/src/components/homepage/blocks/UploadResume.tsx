import React from 'react'
import Link from 'next/link'
import { HomepageSection } from '../HomepageSection'
import { Button } from '@/components/ui/button'
import { ImageWithSkeleton } from '../ImageWithSkeleton'
import { Upload } from 'lucide-react'

// Image assets
const imgYoungSuccessfulMaleFreelancer = '/assets/3c17a3ff86c43991781ca31089548715d93490e0.webp'

export const UploadResume: React.FC = () => {
  return (
    <HomepageSection className="pb-12 sm:pb-16 md:pb-20">
      {/* Background container */}
      <div className="bg-[#ecf2ff] rounded-3xl sm:rounded-[40px] md:rounded-[50px] -mx-4 sm:-mx-6 md:-mx-8 lg:-mx-12 2xl:-mx-[95px] overflow-hidden">
        <div className="px-4 sm:px-6 md:px-8 lg:px-12 2xl:px-[95px] py-8 sm:py-10 md:py-12 lg:py-16">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Left Side - Text and Button */}
            <div className="flex-1 w-full">
              {/* Heading */}
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold font-inter text-[#16252d] leading-tight mb-4 sm:mb-6">
                Put Your CV In Front Of Great Employers
              </h2>

              {/* Paragraph */}
              <p className="text-sm sm:text-base md:text-lg text-[#16252d]/80 leading-relaxed mb-6 sm:mb-8 max-w-xl">
                Take the next step in your career with confidence. Share your CV and let top employers find you based on your skills, experience, and potential.
              </p>

              {/* Upload Button */}
              <Link href="/register">
                <Button className="bg-[#4644b8] hover:bg-[#3a3aa0] text-white rounded-xl px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-medium uppercase tracking-wide flex items-center gap-3">
                  Upload Your Resume
                  <div className="bg-white/20 rounded-lg p-1.5">
                    <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </Button>
              </Link>
            </div>

            {/* Right Side - Image */}
            <div className="flex-shrink-0 w-full lg:w-1/2">
              <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden aspect-[4/3]">
                <ImageWithSkeleton
                  src={imgYoungSuccessfulMaleFreelancer}
                  alt="Professional person"
                  fill
                  objectFit="cover"
                  objectPosition="left center"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </HomepageSection>
  )
}
