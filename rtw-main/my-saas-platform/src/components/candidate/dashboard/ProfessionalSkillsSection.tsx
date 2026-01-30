'use client'

import { useTranslations } from 'next-intl'
import { Award } from 'lucide-react'
import type { Candidate } from '@/payload-types'
import { Card } from '@/components/ui/card'

interface ProfessionalSkillsSectionProps {
  candidate: Candidate
  onUpdate: (data: Partial<Candidate>) => void
}

export function ProfessionalSkillsSection({
  candidate,
  onUpdate,
}: ProfessionalSkillsSectionProps) {
  const t = useTranslations('candidateDashboard.professionalSkills')
  const tCommon = useTranslations('candidateDashboard.common')
  const getPrimarySkillName = () => {
    if (typeof candidate.primarySkill === 'object' && candidate.primarySkill?.name) {
      return candidate.primarySkill.name
    }
    return tCommon('notSet')
  }

  return (
    <Card className="rounded-xl bg-white p-4 shadow-sm sm:rounded-2xl sm:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2 sm:mb-6">
        <Award className="size-5 text-[#282828] sm:size-6" />
        <h3 className="text-base font-semibold text-[#282828] sm:text-lg">{t('title')}</h3>
      </div>

      {/* Content */}
      <div className="space-y-3 sm:space-y-4">
        <div>
          <p className="text-xs text-[#757575]">{t('title')}</p>
          <p className="text-sm font-medium text-[#282828] sm:text-base">{getPrimarySkillName()}</p>
        </div>
      </div>
    </Card>
  )
}
