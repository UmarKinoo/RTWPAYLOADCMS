'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { CandidateDetail, CandidateListItem } from '@/lib/payload/candidates'
import { formatExperience } from '@/lib/utils/candidate-utils'

interface CandidateProfileCardProps {
  candidate: CandidateDetail | CandidateListItem
  className?: string
}

const DEFAULT_PROFILE = '/assets/aa541dc65d58ecc58590a815ca3bf2c27c889667.webp'

export function CandidateProfileCard({
  candidate,
  className,
}: CandidateProfileCardProps) {
  const fullName = `${candidate.firstName} ${candidate.lastName}`
  const profileImage = candidate.profilePictureUrl || DEFAULT_PROFILE

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {/* Hexagonal border container - simplified for modal */}
      <div className="relative flex items-center justify-center">
        <div className="relative size-32 sm:size-40 rounded-full overflow-hidden border-4 border-[#97b9ff] bg-white p-1">
          <Image
            src={profileImage}
            alt={fullName}
            fill
            className="object-cover rounded-full"
            sizes="(max-width: 640px) 128px, 160px"
          />
        </div>
      </div>

      {/* Candidate Info */}
      <div className="text-center space-y-1">
        <h3 className="font-bold text-[#16252d] text-xl sm:text-2xl">{fullName}</h3>
        <p className="font-bold text-[#16252d] text-base sm:text-lg">{candidate.jobTitle}</p>
        <p className="text-[#16252d] text-sm sm:text-base">
          Experience: {formatExperience(candidate.experienceYears)}
        </p>
        <p className="text-[#16252d] text-sm sm:text-base">
          {candidate.location}
        </p>
        {'saudiExperience' in candidate && (
          <p className="text-[#16252d] text-sm sm:text-base">
            {candidate.saudiExperience} Years in Saudi
          </p>
        )}
      </div>
    </div>
  )
}

