'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, User, MapPin, Briefcase, Calendar, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { formatExperience, getNationalityFlag } from '@/lib/utils/candidate-utils'
import type { CandidateToReview } from '@/lib/payload/employer-views'

interface CandidatesToReviewViewProps {
  candidates: CandidateToReview[]
}

export function CandidatesToReviewView({ candidates }: CandidatesToReviewViewProps) {
  return (
    <div className="mt-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link href="/employer/dashboard">
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-[#282828] sm:text-3xl">
            Candidates to Review
          </h1>
          <p className="text-sm text-[#757575]">
            {candidates.length} new candidate{candidates.length === 1 ? '' : 's'} to review
          </p>
        </div>
      </div>

      {/* Candidates Grid */}
      {candidates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {candidates.map((candidate) => {
            const initials = `${candidate.firstName?.[0] || ''}${candidate.lastName?.[0] || ''}`.toUpperCase()
            const nationalityFlag = getNationalityFlag(candidate.nationality)

            return (
              <Card key={candidate.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <Link href={`/candidates/${candidate.id}`} className="block">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <Avatar className="size-16 shrink-0 border-2 border-[#ededed]">
                        {candidate.profilePictureUrl ? (
                          <AvatarImage src={candidate.profilePictureUrl} alt={`${candidate.firstName} ${candidate.lastName}`} />
                        ) : null}
                        <AvatarFallback className="bg-[#ededed] text-[#282828] text-lg font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <h3 className="text-lg font-semibold text-[#282828] truncate">
                              {candidate.firstName} {candidate.lastName}
                            </h3>
                            {candidate.jobTitle && (
                              <div className="flex items-center gap-1 text-sm text-[#757575] mt-1">
                                <Briefcase className="size-3 shrink-0" />
                                <span className="truncate">{candidate.jobTitle}</span>
                              </div>
                            )}
                          </div>
                          {candidate.billingClass && (
                            <Badge variant="outline" className="shrink-0">
                              Class {candidate.billingClass}
                            </Badge>
                          )}
                        </div>

                        {/* Details */}
                        <div className="space-y-1.5">
                          {candidate.primarySkill && (
                            <div className="flex items-center gap-1.5 text-sm text-[#515151]">
                              <Award className="size-3.5 shrink-0 text-[#4644b8]" />
                              <span className="truncate">{candidate.primarySkill.name}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-sm text-[#515151]">
                            <Calendar className="size-3.5 shrink-0 text-[#4644b8]" />
                            <span>{formatExperience(candidate.experienceYears)} experience</span>
                          </div>
                          {candidate.location && (
                            <div className="flex items-center gap-1.5 text-sm text-[#515151]">
                              <MapPin className="size-3.5 shrink-0 text-[#4644b8]" />
                              <span className="truncate">{candidate.location}</span>
                            </div>
                          )}
                          {candidate.nationality && (
                            <div className="flex items-center gap-1.5 text-sm text-[#515151]">
                              {nationalityFlag && <span className="text-base">{nationalityFlag}</span>}
                              <span>{candidate.nationality}</span>
                            </div>
                          )}
                        </div>

                        {/* View Profile Button */}
                        <Button
                          variant="outline"
                          className="w-full mt-4 border-[#4644b8] text-[#4644b8] hover:bg-[#4644b8] hover:text-white"
                          onClick={(e) => {
                            e.preventDefault()
                            window.location.href = `/candidates/${candidate.id}`
                          }}
                        >
                          <User className="mr-2 size-4" />
                          View Profile
                        </Button>
                      </div>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <User className="mb-4 h-12 w-12 text-[#cbcbcb]" />
            <h3 className="mb-2 text-lg font-semibold text-[#282828]">No candidates to review</h3>
            <p className="text-sm text-[#757575]">
              You've reviewed all available candidates. Check back later for new candidates.
            </p>
            <Link href="/candidates" className="mt-4">
              <Button variant="outline" className="border-[#4644b8] text-[#4644b8]">
                Browse All Candidates
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

