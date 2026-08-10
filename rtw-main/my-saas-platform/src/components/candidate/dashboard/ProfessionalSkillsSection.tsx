'use client'

import { useTranslations } from 'next-intl'
import { Award, Edit2, Save, X } from 'lucide-react'
import { useState } from 'react'
import type { Candidate, Skill } from '@/payload-types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SkillSearch } from '@/components/candidate/SkillSearch'
import { updateCandidate } from '@/lib/candidate'
import { toast } from 'sonner'

interface ProfessionalSkillsSectionProps {
  candidate: Candidate
  onUpdate: (data: Partial<Candidate>) => void
}

function skillId(skill: number | Skill | null | undefined): string {
  if (skill == null) return ''
  if (typeof skill === 'object') return String(skill.id)
  return String(skill)
}

function skillName(skill: number | Skill | null | undefined, fallback: string): string {
  if (skill && typeof skill === 'object' && skill.name) return skill.name
  return fallback
}

export function ProfessionalSkillsSection({
  candidate,
  onUpdate,
}: ProfessionalSkillsSectionProps) {
  const t = useTranslations('candidateDashboard.professionalSkills')
  const tCommon = useTranslations('candidateDashboard.common')
  const tSkill = useTranslations('registration.skillSearch')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    primarySkill: skillId(candidate.primarySkill),
    secondarySkill: skillId(candidate.secondarySkill),
    tertiarySkill: skillId(candidate.tertiarySkill),
  })
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!formData.primarySkill) {
      setError(t('primaryRequired'))
      return
    }
    if (
      formData.secondarySkill &&
      formData.secondarySkill === formData.primarySkill
    ) {
      setError(t('skillsMustDiffer'))
      return
    }
    if (
      formData.tertiarySkill &&
      (formData.tertiarySkill === formData.primarySkill ||
        formData.tertiarySkill === formData.secondarySkill)
    ) {
      setError(t('skillsMustDiffer'))
      return
    }

    setError(null)
    setIsSaving(true)
    try {
      const result = await updateCandidate(candidate.id, {
        primarySkill: formData.primarySkill,
        secondarySkill: formData.secondarySkill || '',
        tertiarySkill: formData.tertiarySkill || '',
      })

      if (result.success) {
        onUpdate(result.candidate || {})
        setIsEditing(false)
        toast.success(t('skillsUpdated'))
      } else {
        toast.error(result.error || tCommon('failedToUpdate'))
      }
    } catch {
      toast.error(tCommon('anErrorOccurred'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      primarySkill: skillId(candidate.primarySkill),
      secondarySkill: skillId(candidate.secondarySkill),
      tertiarySkill: skillId(candidate.tertiarySkill),
    })
    setError(null)
    setIsEditing(false)
  }

  return (
    <Card className="rounded-xl bg-white p-4 shadow-sm sm:rounded-2xl sm:p-6">
      <div className="mb-4 flex items-center justify-between sm:mb-6">
        <div className="flex items-center gap-2">
          <Award className="size-5 text-[#282828] sm:size-6" />
          <h3 className="text-base font-semibold text-[#282828] sm:text-lg">{t('title')}</h3>
        </div>
        {!isEditing ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="text-[#4644b8] hover:text-[#4644b8] hover:bg-[#4644b8]/10"
          >
            <Edit2 className="mr-2 size-4" />
            {tCommon('edit')}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <X className="mr-2 size-4" />
              {tCommon('cancel')}
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#4644b8] text-white hover:bg-[#3a3aa0] hover:text-white"
            >
              <Save className="mr-2 size-4" />
              {isSaving ? tCommon('saving') : tCommon('save')}
            </Button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <SkillSearch
            inputId="dashboard-primary-skill"
            label={tSkill('primaryLabel')}
            value={formData.primarySkill}
            onValueChange={(id) => setFormData((prev) => ({ ...prev, primarySkill: id }))}
            excludeSkillIds={[formData.secondarySkill, formData.tertiarySkill].filter(Boolean)}
          />
          <SkillSearch
            inputId="dashboard-secondary-skill"
            label={tSkill('secondaryLabel')}
            placeholder={tSkill('optionalPlaceholder')}
            value={formData.secondarySkill}
            onValueChange={(id) =>
              setFormData((prev) => ({ ...prev, secondarySkill: id || '' }))
            }
            excludeSkillIds={[formData.primarySkill, formData.tertiarySkill].filter(Boolean)}
          />
          <SkillSearch
            inputId="dashboard-tertiary-skill"
            label={tSkill('tertiaryLabel')}
            placeholder={tSkill('optionalPlaceholder')}
            value={formData.tertiarySkill}
            onValueChange={(id) =>
              setFormData((prev) => ({ ...prev, tertiarySkill: id || '' }))
            }
            excludeSkillIds={[formData.primarySkill, formData.secondarySkill].filter(Boolean)}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          <div>
            <p className="text-xs text-[#757575]">{t('primarySkill')}</p>
            <p className="text-sm font-medium text-[#282828] sm:text-base">
              {skillName(candidate.primarySkill, tCommon('notSet'))}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#757575]">{t('secondarySkill')}</p>
            <p className="text-sm font-medium text-[#282828] sm:text-base">
              {skillName(candidate.secondarySkill, tCommon('notSet'))}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#757575]">{t('tertiarySkill')}</p>
            <p className="text-sm font-medium text-[#282828] sm:text-base">
              {skillName(candidate.tertiarySkill, tCommon('notSet'))}
            </p>
          </div>
        </div>
      )}
    </Card>
  )
}
