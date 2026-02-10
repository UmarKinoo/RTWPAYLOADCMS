'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { CandidateDetail, CandidateListItem } from '@/lib/payload/candidates'
import { formatExperience } from '@/lib/utils/candidate-utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitialsFromFirstLast, getColorFromName } from '@/components/navbar/AvatarCircle'

interface CandidateProfileCardProps {
  candidate: CandidateDetail | CandidateListItem
  className?: string
}

export function CandidateProfileCard({
  candidate,
  className,
}: CandidateProfileCardProps) {
  const fullName = `${candidate.firstName} ${candidate.lastName}`
  const profilePictureUrl = candidate.profilePictureUrl
  const initials = getInitialsFromFirstLast(candidate.firstName, candidate.lastName)
  const bgColor = getColorFromName(fullName)

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {/* Hexagonal border container - simplified for modal */}
      <div className="relative flex items-center justify-center">
        <div className="relative size-32 sm:size-40 rounded-full overflow-hidden border-4 border-[#97b9ff] bg-white p-1">
          {profilePictureUrl ? (
            <Image
              src={profilePictureUrl}
              alt={fullName}
              fill
              className="object-cover rounded-full"
              sizes="(max-width: 640px) 128px, 160px"
            />
          ) : (
            <Avatar className="size-full rounded-full" style={{ backgroundColor: bgColor }}>
              <AvatarFallback className="text-white text-2xl sm:text-3xl font-semibold bg-transparent">
                {initials}
              </AvatarFallback>
            </Avatar>
          )}
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

