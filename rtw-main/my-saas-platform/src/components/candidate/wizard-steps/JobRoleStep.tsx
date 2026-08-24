'use client'

import { useState } from 'react'
import { UseFormSetValue, FieldErrors } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { AddJobRoleButton, JobRolePicker } from '@/components/candidate/JobRolePicker'
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
  const tp = useTranslations('registration.jobRolePicker')

  const [showSecondary, setShowSecondary] = useState(Boolean(secondarySkill))
  const [showTertiary, setShowTertiary] = useState(Boolean(tertiarySkill))

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{t('description')}</p>

      <JobRolePicker
        label={tp('primaryLabel')}
        value={primarySkill}
        onValueChange={(skillId) => setValue('primarySkill', skillId)}
        error={errors.primarySkill?.message}
        excludeSkillIds={[secondarySkill, tertiarySkill].filter(Boolean) as string[]}
      />

      {showSecondary ? (
        <JobRolePicker
          label={tp('secondaryLabel')}
          value={secondarySkill}
          forceOpen={!secondarySkill}
          onValueChange={(skillId) => setValue('secondarySkill', skillId || undefined)}
          error={errors.secondarySkill?.message}
          excludeSkillIds={[primarySkill, tertiarySkill].filter(Boolean) as string[]}
          onRemove={() => {
            setValue('secondarySkill', undefined)
            setShowSecondary(false)
            if (showTertiary && !tertiarySkill) {
              // keep tertiary open if already shown
            }
          }}
        />
      ) : (
        primarySkill && (
          <AddJobRoleButton
            label={tp('addSecond')}
            onClick={() => setShowSecondary(true)}
          />
        )
      )}

      {showTertiary ? (
        <JobRolePicker
          label={tp('tertiaryLabel')}
          value={tertiarySkill}
          forceOpen={!tertiarySkill}
          onValueChange={(skillId) => setValue('tertiarySkill', skillId || undefined)}
          error={errors.tertiarySkill?.message}
          excludeSkillIds={[primarySkill, secondarySkill].filter(Boolean) as string[]}
          onRemove={() => {
            setValue('tertiarySkill', undefined)
            setShowTertiary(false)
          }}
        />
      ) : (
        showSecondary &&
        secondarySkill && (
          <AddJobRoleButton
            label={tp('addThird')}
            onClick={() => setShowTertiary(true)}
          />
        )
      )}
    </div>
  )
}
