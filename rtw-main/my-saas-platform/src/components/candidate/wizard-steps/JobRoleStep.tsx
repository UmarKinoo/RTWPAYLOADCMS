'use client'

import { useState } from 'react'
import { UseFormSetValue, FieldErrors, UseFormRegister, UseFormClearErrors } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { AddJobRoleButton, JobRolePicker } from '@/components/candidate/JobRolePicker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { CandidateFormData } from '../RegistrationWizard'

interface JobRoleStepProps {
  primarySkill?: string
  secondarySkill?: string
  tertiarySkill?: string
  customOtherJob?: string
  setValue: UseFormSetValue<CandidateFormData>
  register: UseFormRegister<CandidateFormData>
  clearErrors: UseFormClearErrors<CandidateFormData>
  errors: FieldErrors<CandidateFormData>
}

export function JobRoleStep({
  primarySkill,
  secondarySkill,
  tertiarySkill,
  customOtherJob,
  setValue,
  register,
  clearErrors,
  errors,
}: JobRoleStepProps) {
  const t = useTranslations('registration.jobRole')
  const tp = useTranslations('registration.jobRolePicker')

  const [showSecondary, setShowSecondary] = useState(Boolean(secondarySkill))
  const [showTertiary, setShowTertiary] = useState(Boolean(tertiarySkill))
  const [useOtherJob, setUseOtherJob] = useState(
    Boolean(customOtherJob?.trim()) && !primarySkill,
  )

  const selectFromTree = () => {
    setUseOtherJob(false)
    setValue('customOtherJob', undefined)
    clearErrors(['customOtherJob', 'primarySkill'])
  }

  const selectOther = () => {
    setUseOtherJob(true)
    setValue('primarySkill', undefined)
    setValue('secondarySkill', undefined)
    setValue('tertiarySkill', undefined)
    setShowSecondary(false)
    setShowTertiary(false)
    clearErrors(['primarySkill', 'secondarySkill', 'tertiarySkill'])
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{t('description')}</p>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={useOtherJob ? 'outline' : 'default'}
          size="sm"
          onClick={selectFromTree}
          className={!useOtherJob ? 'bg-[#4644b8] hover:bg-[#3a38a0]' : undefined}
        >
          {tp('fromList')}
        </Button>
        <Button
          type="button"
          variant={useOtherJob ? 'default' : 'outline'}
          size="sm"
          onClick={selectOther}
          className={useOtherJob ? 'bg-[#4644b8] hover:bg-[#3a38a0]' : undefined}
        >
          {tp('otherJob')}
        </Button>
      </div>

      {useOtherJob ? (
        <div className="space-y-2">
          <Label htmlFor="customOtherJob">{tp('otherJobLabel')}</Label>
          <Input
            id="customOtherJob"
            placeholder={tp('otherJobPlaceholder')}
            {...register('customOtherJob')}
            aria-invalid={Boolean(errors.customOtherJob || errors.primarySkill)}
          />
          <p className="text-xs text-muted-foreground">{tp('otherJobHint')}</p>
          {(errors.customOtherJob?.message || errors.primarySkill?.message) && (
            <p className="text-sm text-destructive">
              {errors.customOtherJob?.message || errors.primarySkill?.message}
            </p>
          )}
        </div>
      ) : (
        <>
          <JobRolePicker
            label={tp('primaryLabel')}
            value={primarySkill}
            onValueChange={(skillId) => {
              setValue('primarySkill', skillId)
              setValue('customOtherJob', undefined)
              clearErrors(['primarySkill', 'customOtherJob'])
            }}
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
        </>
      )}
    </div>
  )
}
