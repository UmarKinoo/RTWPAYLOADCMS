'use client'

import React from 'react'
import { ImageWithSkeleton } from '../ImageWithSkeleton'
import { useTranslations } from 'next-intl'
import type { CandidateCardProps } from './Candidates'
import { getCandidateCardAssets } from '@/lib/utils/candidate-card-assets'
import type { BillingClass } from '@/lib/billing'
import { cn } from '@/lib/utils'
import { getInitialsFromFirstLast, getColorFromName } from '@/components/navbar/AvatarCircle'

export const CandidateCard: React.FC<CandidateCardProps> = ({
  name,
  jobTitle,
  experience,
  nationality,
  nationalityFlag,
  location,
  profileImage,
  firstName,
  lastName,
  billingClass,
  locked = false,
  displayLabel,
}) => {
  const t = useTranslations('homepage.candidates')
  const displayName = locked && displayLabel != null ? displayLabel : name
  const showInitials = !profileImage
  const initials = getInitialsFromFirstLast(
    firstName ?? name.split(' ')[0],
    lastName ?? (name.split(' ').slice(1).join(' ') || null),
  )
  const initialsBgColor = getColorFromName(name)

  // Get assets based on billing class
  const assets = getCandidateCardAssets(billingClass as BillingClass | null)
  
  const MASK_STYLE = {
    maskImage: `url('${assets.profileMask}')`,
    WebkitMaskImage: `url('${assets.profileMask}')`,
    maskSize: '100% 100%',
    maskPosition: 'center',
    maskRepeat: 'no-repeat',
  } as const

  return (
    <div className={cn('relative w-full aspect-[341/530] max-w-[180px] sm:max-w-[200px] md:max-w-[220px] lg:max-w-[240px] xl:max-w-[280px] 2xl:max-w-[320px] mx-auto', locked && 'select-none')}>
      {/* Outer Vector Border */}
      <div className={cn('absolute inset-0 z-0', locked && 'blur-[6px]')}>
        <ImageWithSkeleton src={assets.vector} alt="" fill objectFit="contain" />
      </div>

      {/* Inner Card Content – blurred when locked */}
      <div className={cn('absolute inset-[2%] z-10', locked && 'blur-[6px]')}>
        {/* Background Layers */}
        <div className="absolute inset-0">
          <ImageWithSkeleton src={assets.layer1} alt="" fill objectFit="contain" />
        </div>
        <div className="absolute" style={{ inset: '1.39% 0.31% 23.89% 0.22%' }}>
          <ImageWithSkeleton src={assets.layer2} alt="" fill objectFit="contain" />
        </div>
        <div className="absolute" style={{ inset: '1.39% 0.31% 23.89% 0.22%' }}>
          <ImageWithSkeleton src={assets.layer3} alt="" fill objectFit="contain" />
        </div>

        {/* Profile Image or initials */}
        <div className="absolute top-[15%] left-1/2 -translate-x-1/2 z-20 w-[56.9%] aspect-square">
          <div className="relative w-full h-full" style={MASK_STYLE}>
            {showInitials ? (
              <div
                className="absolute inset-0 flex items-center justify-center text-white font-semibold text-lg sm:text-xl md:text-2xl"
                style={{ backgroundColor: initialsBgColor }}
              >
                {initials}
              </div>
            ) : (
              <ImageWithSkeleton
                src={profileImage!}
                alt={name}
                fill
                objectFit="cover"
                objectPosition="center"
              />
            )}
          </div>
        </div>

        {/* Text Content */}
        <div className="absolute top-[60%] left-0 right-0 px-2 sm:px-3 text-center flex flex-col items-center gap-0.5">
          <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-[#16252d] font-inter leading-tight truncate w-full">
            {displayName}
          </h3>
          <p className="text-[10px] sm:text-xs md:text-sm font-semibold text-[#16252d] font-inter leading-tight truncate w-full">
            {jobTitle}
          </p>
          <p className="text-[9px] sm:text-[10px] md:text-xs text-[#757575] font-inter leading-tight">
            {t('experience')}: <span className="font-medium">{experience}</span>
          </p>
          <div className="flex items-center justify-center gap-1">
            <p className="text-[9px] sm:text-[10px] md:text-xs text-[#757575] font-inter leading-tight">
              {t('nationality')}: <span className="font-medium">{nationality}</span>
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
            {t('location')}: <span className="font-medium">{location}</span>
          </p>
        </div>
      </div>

      {/* Locked overlay: role + CTA (employers only) */}
      {locked && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-3 py-4 bg-white/60 rounded-lg">
          <p className="text-sm sm:text-base font-bold text-[#16252d] font-inter text-center leading-tight mb-1">
            {displayName}
          </p>
          <p className="text-[10px] sm:text-xs font-medium text-[#4644b8] text-center">
            {t('signInAsEmployerToView')}
          </p>
        </div>
      )}
    </div>
  )
}

interface CandidatesClientProps {
  candidates: CandidateCardProps[]
}

export const CandidatesClient: React.FC<CandidatesClientProps> = ({ candidates }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
      {candidates.map((candidate, index) => (
        <CandidateCard key={index} {...candidate} />
      ))}
    </div>
  )
}

