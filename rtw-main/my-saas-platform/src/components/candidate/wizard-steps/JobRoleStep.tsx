'use client'

import { UseFormSetValue } from 'react-hook-form'
import { SkillSearch } from '@/components/candidate/SkillSearch'
import type { CandidateFormData } from '../RegistrationWizard'

interface JobRoleStepProps {
  primarySkill: string
  setValue: UseFormSetValue<CandidateFormData>
  error?: string
}

export function JobRoleStep({ primarySkill, setValue, error }: JobRoleStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground mb-4">
          Search and select your primary job role or skill. This will help us match you with relevant opportunities.
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


















