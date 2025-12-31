import React from 'react'
import { HomepageSection } from '../HomepageSection'
import { ImageWithSkeleton } from '../ImageWithSkeleton'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

// Image assets
const ASSETS = {
  vector: '/assets/2b2ca666fdce1524e5659a70cf4e087a81bfff05.svg',
  layer1: '/assets/a7a6577a6e8f7ac7c9f5b2f297869418ec6c25a8.svg',
  layer2: '/assets/dd8a7a001109c2610d05f06cc36f25d190c796e3.svg',
  layer3: '/assets/2c1d0ff68c44608b5625f8ecb9c38cf7e116885a.svg',
  profileMask: '/assets/e223af9be935490b430d9d6b758a27ceb15c14ec.svg',
  profileImage: '/assets/aa541dc65d58ecc58590a815ca3bf2c27c889667.webp',
  flag: '/assets/6bfc87a7895d9ede7eec660bd3a5265b0ed88762.webp',
} as const

const MASK_STYLE = {
  maskImage: `url('${ASSETS.profileMask}')`,
  WebkitMaskImage: `url('${ASSETS.profileMask}')`,
  maskSize: '100% 100%',
  maskPosition: 'center',
  maskRepeat: 'no-repeat',
} as const

export interface CandidateCardProps {
  name: string
  jobTitle: string
  experience: string
  nationality: string
  nationalityFlag: string
  location: string
  profileImage: string
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  name,
  jobTitle,
  experience,
  nationality,
  nationalityFlag,
  location,
  profileImage,
}) => {
  return (
    <div className="relative w-full aspect-[341/530] max-w-[180px] sm:max-w-[200px] md:max-w-[220px] lg:max-w-[240px] xl:max-w-[280px] 2xl:max-w-[320px] mx-auto">
      {/* Outer Vector Border */}
      <div className="absolute inset-0 z-0">
        <ImageWithSkeleton src={ASSETS.vector} alt="" fill objectFit="contain" />
      </div>

      {/* Inner Card Content */}
      <div className="absolute inset-[2%] z-10">
        {/* Background Layers */}
        <div className="absolute inset-0">
          <ImageWithSkeleton src={ASSETS.layer1} alt="" fill objectFit="contain" />
        </div>
        <div className="absolute" style={{ inset: '1.39% 0.31% 23.89% 0.22%' }}>
          <ImageWithSkeleton src={ASSETS.layer2} alt="" fill objectFit="contain" />
        </div>
        <div className="absolute" style={{ inset: '1.39% 0.31% 23.89% 0.22%' }}>
          <ImageWithSkeleton src={ASSETS.layer3} alt="" fill objectFit="contain" />
        </div>

        {/* Profile Image */}
        <div className="absolute top-[15%] left-1/2 -translate-x-1/2 z-20 w-[56.9%] aspect-square">
          <div className="relative w-full h-full" style={MASK_STYLE}>
            <ImageWithSkeleton
              src={profileImage}
              alt={name}
              fill
              objectFit="cover"
              objectPosition="center"
            />
          </div>
        </div>

        {/* Text Content */}
        <div className="absolute top-[60%] left-0 right-0 px-2 sm:px-3 text-center flex flex-col items-center gap-0.5">
          <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-[#16252d] font-inter leading-tight truncate w-full">
            {name}
          </h3>
          <p className="text-[10px] sm:text-xs md:text-sm font-semibold text-[#16252d] font-inter leading-tight truncate w-full">
            {jobTitle}
          </p>
          <p className="text-[9px] sm:text-[10px] md:text-xs text-[#757575] font-inter leading-tight">
            Experience: <span className="font-medium">{experience}</span>
          </p>
          <div className="flex items-center justify-center gap-1">
            <p className="text-[9px] sm:text-[10px] md:text-xs text-[#757575] font-inter leading-tight">
              Nationality: <span className="font-medium">{nationality}</span>
            </p>
            <div
              className="relative rounded-[2px] overflow-hidden flex-shrink-0 w-3 sm:w-4 aspect-[3/2]"
              style={{ boxShadow: '0px 2px 2px 0px rgba(0,0,0,0.25)' }}
            >
              <ImageWithSkeleton
                src={nationalityFlag}
                alt={`${nationality} flag`}
                fill
                objectFit="cover"
              />
            </div>
          </div>
          <p className="text-[9px] sm:text-[10px] md:text-xs text-[#757575] font-inter leading-tight">
            Location: <span className="font-medium">{location}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export const Candidates: React.FC = () => {
  const candidates = [
    {
      name: 'Ali Al-Hamdan',
      jobTitle: 'House Cleaner',
      experience: '3-5 years',
      nationality: 'Saudi',
      nationalityFlag: ASSETS.flag,
      location: 'Saudi',
      profileImage: ASSETS.profileImage,
    },
    {
      name: 'Mohammed Al-Rashid',
      jobTitle: 'Driver',
      experience: '5-7 years',
      nationality: 'Saudi',
      nationalityFlag: ASSETS.flag,
      location: 'Saudi',
      profileImage: ASSETS.profileImage,
    },
    {
      name: 'Ahmed Al-Mansouri',
      jobTitle: 'Security Guard',
      experience: '2-4 years',
      nationality: 'Saudi',
      nationalityFlag: ASSETS.flag,
      location: 'Saudi',
      profileImage: ASSETS.profileImage,
    },
    {
      name: 'Hassan Al-Zahrani',
      jobTitle: 'Cook',
      experience: '4-6 years',
      nationality: 'Saudi',
      nationalityFlag: ASSETS.flag,
      location: 'Saudi',
      profileImage: ASSETS.profileImage,
    },
  ]

  return (
    <HomepageSection className="pb-12 sm:pb-16 md:pb-20">
      {/* Background container - full width grey */}
      <div className="bg-[#f5f5f5] rounded-t-3xl sm:rounded-t-[40px] md:rounded-t-[50px] lg:rounded-t-[60px] -mx-4 sm:-mx-6 md:-mx-8 lg:-mx-12 2xl:-mx-[95px] overflow-hidden">
        <div className="px-4 sm:px-6 md:px-8 lg:px-12 2xl:px-[95px] py-8 sm:py-10 md:py-12 lg:py-16">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8 md:mb-10">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold font-inter text-[#16252d] mb-2 sm:mb-3">
              Candidates
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl font-normal font-inter text-gray-600">
              Search over 30,475 skilled candidates ready to work.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
            {candidates.map((candidate, index) => (
              <CandidateCard key={index} {...candidate} />
            ))}
          </div>

          {/* CTA Button */}
          <div className="flex justify-center mt-6 sm:mt-8 md:mt-10">
            <Link href="/candidates">
              <Button className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-bold uppercase tracking-wide">
                Find More Candidates
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </HomepageSection>
  )
}
