import React from 'react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronRight, User, MapPin, Briefcase } from 'lucide-react'
import { getRecentCandidateSearches } from '@/lib/payload/employer-dashboard'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getMediaUrl } from '@/utilities/getMediaUrl'

interface RecentlySearchedCandidatesProps {
  employerId: number
}

export async function RecentlySearchedCandidates({ employerId }: RecentlySearchedCandidatesProps) {
  const recentSearches = await getRecentCandidateSearches(employerId)
  const t = await getTranslations('employerDashboard.recentlySearched')

  if (recentSearches.length === 0) {
    return (
      <Card className="flex flex-col gap-4 overflow-hidden rounded-2xl bg-white p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-[#222] sm:text-lg">
            {t('title')}
          </h3>
        </div>
        <div className="flex items-center justify-center py-8 text-sm text-[#757575]">
          {t('noRecentSearches')}
        </div>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col gap-4 overflow-hidden rounded-2xl bg-white p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-[#222] sm:text-lg">
          {t('title')}
        </h3>
        <Link href="/candidates">
          <Button variant="ghost" className="h-8 w-fit gap-2 px-4 py-2">
            <span className="text-sm font-medium text-[#222]">{t('viewAll')}</span>
            <ChevronRight className="size-6 text-[#222]" />
          </Button>
        </Link>
      </div>

      {/* Candidates List */}
      <div className="flex flex-col gap-3">
        {recentSearches.map((search) => {
          const candidate = search.candidate
          const profilePictureUrl =
            candidate.profilePicture && typeof candidate.profilePicture === 'object'
              ? getMediaUrl(candidate.profilePicture.url, candidate.profilePicture.updatedAt)
              : null
          const initials = `${candidate.firstName?.[0] || ''}${candidate.lastName?.[0] || ''}`.toUpperCase()

          return (
            <Link
              key={search.id}
              href={`/candidates/${candidate.id}`}
              className="flex items-center gap-3 rounded-lg border border-[#ededed] p-3 transition-colors hover:bg-[#f5f5f5] hover:border-[#cbcbcb]"
            >
              <Avatar className="size-12 shrink-0 overflow-hidden rounded-lg border border-[#ededed]">
                {profilePictureUrl ? (
                  <AvatarImage src={profilePictureUrl} alt={`${candidate.firstName} ${candidate.lastName}`} />
                ) : null}
                <AvatarFallback className="bg-[#ededed] text-[#282828] text-sm font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#222] truncate">
                      {candidate.firstName} {candidate.lastName}
                    </p>
                    {candidate.jobTitle && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-[#757575]">
                        <Briefcase className="size-3" />
                        <span className="truncate">{candidate.jobTitle}</span>
                      </div>
                    )}
                    {candidate.location && (
                      <div className="mt-0.5 flex items-center gap-1 text-xs text-[#757575]">
                        <MapPin className="size-3" />
                        <span className="truncate">{candidate.location}</span>
                      </div>
                    )}
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-[#757575]" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </Card>
  )
}







