import React from 'react'
import { HomepageSection } from '../HomepageSection'
import { Button } from '@/components/ui/button'
import { ImageWithSkeleton } from '../ImageWithSkeleton'
import { Upload } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { UploadResumeButton } from './UploadResumeButton'

// Image assets
const imgYoungSuccessfulMaleFreelancer = '/assets/3c17a3ff86c43991781ca31089548715d93490e0.webp'

export const UploadResume: React.FC = async () => {
  const t = await getTranslations('homepage.uploadResume')

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
                {t('title')}
              </h2>

              {/* Paragraph */}
              <p className="text-sm sm:text-base md:text-lg text-[#16252d]/80 leading-relaxed mb-6 sm:mb-8 max-w-xl">
                {t('description')}
              </p>

              {/* Upload Button */}
              <UploadResumeButton />
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
