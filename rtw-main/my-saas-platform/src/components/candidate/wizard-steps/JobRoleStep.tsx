'use client'

import { UseFormSetValue } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { SkillSearch } from '@/components/candidate/SkillSearch'
import type { CandidateFormData } from '../RegistrationWizard'

interface JobRoleStepProps {
  primarySkill: string
  setValue: UseFormSetValue<CandidateFormData>
  error?: string
}

export function JobRoleStep({ primarySkill, setValue, error }: JobRoleStepProps) {
  const t = useTranslations('registration.jobRole')
  
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground mb-4">
          {t('description')}
        </p>
        <SkillSearch
          value={primarySkill}
          onValueChange={(skillId) => setValue('primarySkill', skillId)}
          error={error}
        />
      </div>
    </div>
  )
}


















