'use client'

import { UseFormSetValue, FieldErrors } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { SkillSearch } from '@/components/candidate/SkillSearch'
import type { CandidateFormData } from '../RegistrationWizard'

interface JobRoleStepProps {
  primarySkill: string
  secondarySkill?: string
  tertiarySkill?: string
  setValue: UseFormSetValue<CandidateFormData>
  errors: FieldErrors<CandidateFormData>
}

export function JobRoleStep({
  primarySkill,
  secondarySkill,
  tertiarySkill,
  setValue,
  errors,
}: JobRoleStepProps) {
  const t = useTranslations('registration.jobRole')
  const tSkill = useTranslations('registration.skillSearch')

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{t('description')}</p>

      <SkillSearch
        inputId="primary-skill-search"
        label={tSkill('primaryLabel')}
        value={primarySkill}
        onValueChange={(skillId) => setValue('primarySkill', skillId)}
        error={errors.primarySkill?.message}
        excludeSkillIds={[secondarySkill, tertiarySkill].filter(Boolean) as string[]}
      />

      <SkillSearch
        inputId="secondary-skill-search"
        label={tSkill('secondaryLabel')}
        placeholder={tSkill('optionalPlaceholder')}
        value={secondarySkill}
        onValueChange={(skillId) => setValue('secondarySkill', skillId || undefined)}
        error={errors.secondarySkill?.message}
        excludeSkillIds={[primarySkill, tertiarySkill].filter(Boolean) as string[]}
      />

      <SkillSearch
        inputId="tertiary-skill-search"
        label={tSkill('tertiaryLabel')}
        placeholder={tSkill('optionalPlaceholder')}
        value={tertiarySkill}
        onValueChange={(skillId) => setValue('tertiarySkill', skillId || undefined)}
        error={errors.tertiarySkill?.message}
        excludeSkillIds={[primarySkill, secondarySkill].filter(Boolean) as string[]}
      />
    </div>
  )
}
