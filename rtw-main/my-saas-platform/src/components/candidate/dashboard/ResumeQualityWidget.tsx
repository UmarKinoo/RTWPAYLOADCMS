'use client'

import type { Candidate } from '@/payload-types'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface ResumeQualityWidgetProps {
  candidate: Candidate
}

export function ResumeQualityWidget({ candidate }: ResumeQualityWidgetProps) {
  // Calculate resume completeness (simplified)
  const calculateCompleteness = () => {
    let score = 0
    if (candidate.firstName && candidate.lastName) score += 10
    if (candidate.email) score += 10
    if (candidate.phone) score += 5
    if (candidate.jobTitle) score += 5
    if (candidate.primarySkill) score += 10
    if (candidate.experienceYears) score += 10
    if (candidate.location) score += 5
    if (candidate.visaStatus) score += 5
    // Add more fields as needed
    return Math.min(score, 100)
  }

  const completeness = calculateCompleteness()

  return (
    <Card className="rounded-xl bg-white p-4 shadow-sm sm:rounded-2xl sm:p-6">
      {/* Header */}
      <h3 className="mb-4 text-center text-base font-semibold text-[#282828] sm:mb-6 sm:text-lg">
        Your Resume Quality
      </h3>

      {/* Progress Display */}
      <div className="mb-4 flex flex-col items-center justify-center gap-3 sm:mb-6 sm:gap-4">
        <div className="text-3xl font-bold text-[#282828] sm:text-4xl">{completeness}%</div>
        <div className="w-full max-w-[200px]">
          <Progress value={completeness} className="h-2.5 sm:h-3" />
        </div>
      </div>

      <Separator className="mb-4 bg-[#ededed] sm:mb-6" />

      {/* Improvement Suggestions */}
      <div className="space-y-3 sm:space-y-4">
        <p className="text-center text-xs font-semibold text-[#282828] sm:text-sm">
          Your resume is {completeness}% complete! Let's improve it
        </p>
        <div className="space-y-2 sm:space-y-3">
          {!candidate.jobTitle && (
            <div className="flex items-center gap-2">
              <Badge className="border-[#4644b8] bg-[#4644b8]/10 text-[#4644b8] hover:bg-[#4644b8]/20 text-[10px] sm:text-xs">
                +5%
              </Badge>
              <p className="text-[10px] text-[#757575] sm:text-xs">Complete your job title</p>
            </div>
          )}
          {!candidate.location && (
            <div className="flex items-center gap-2">
              <Badge className="border-[#4644b8] bg-[#4644b8]/10 text-[#4644b8] hover:bg-[#4644b8]/20 text-[10px] sm:text-xs">
                +5%
              </Badge>
              <p className="text-[10px] text-[#757575] sm:text-xs">Complete personal information</p>
            </div>
          )}
          {!candidate.experienceYears && (
            <div className="flex items-center gap-2">
              <Badge className="border-[#4644b8] bg-[#4644b8]/10 text-[#4644b8] hover:bg-[#4644b8]/20 text-[10px] sm:text-xs">
                +5%
              </Badge>
              <p className="text-[10px] text-[#757575] sm:text-xs">Add your work experience</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
