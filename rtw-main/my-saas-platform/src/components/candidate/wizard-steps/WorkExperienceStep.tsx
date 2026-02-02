'use client'

import { UseFormRegister, FieldErrors, Control } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { CandidateFormData } from '../RegistrationWizard'

interface WorkExperienceStepProps {
  register: UseFormRegister<CandidateFormData>
  errors: FieldErrors<CandidateFormData>
  control: Control<CandidateFormData>
}

export function WorkExperienceStep({ register, errors }: WorkExperienceStepProps) {
  const t = useTranslations('registration.workExperience')
  return (
    <div className="space-y-6">
      <Field data-invalid={!!errors.jobTitle}>
        <FieldLabel htmlFor="jobTitle">{t('jobTitle')}</FieldLabel>
        <Input
          id="jobTitle"
          {...register('jobTitle')}
          placeholder={t('placeholderJobTitle')}
        />
        {errors.jobTitle && <FieldError>{errors.jobTitle.message}</FieldError>}
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field data-invalid={!!errors.experienceYears}>
          <FieldLabel htmlFor="experienceYears">{t('totalExperienceYears')}</FieldLabel>
          <Input
            id="experienceYears"
            type="number"
            {...register('experienceYears', { valueAsNumber: true })}
            placeholder={t('placeholderExperience')}
            min={0}
          />
          {errors.experienceYears && <FieldError>{errors.experienceYears.message}</FieldError>}
        </Field>

        <Field data-invalid={!!errors.saudiExperience}>
          <FieldLabel htmlFor="saudiExperience">{t('experienceInSaudi')}</FieldLabel>
          <Input
            id="saudiExperience"
            type="number"
            {...register('saudiExperience', { valueAsNumber: true })}
            placeholder={t('placeholderSaudi')}
            min={0}
          />
          {errors.saudiExperience && <FieldError>{errors.saudiExperience.message}</FieldError>}
        </Field>
      </div>

      <Field data-invalid={!!errors.currentEmployer}>
        <FieldLabel htmlFor="currentEmployer">{t('currentEmployerOptional')}</FieldLabel>
        <Input
          id="currentEmployer"
          {...register('currentEmployer')}
          placeholder={t('placeholderEmployer')}
        />
        {errors.currentEmployer && <FieldError>{errors.currentEmployer.message}</FieldError>}
      </Field>

      <Field data-invalid={!!errors.availabilityDate}>
        <FieldLabel htmlFor="availabilityDate">{t('dateAvailable')}</FieldLabel>
        <Input
          id="availabilityDate"
          type="date"
          {...register('availabilityDate')}
          placeholder={t('placeholderAvailability')}
        />
        {errors.availabilityDate && <FieldError>{errors.availabilityDate.message}</FieldError>}
      </Field>
    </div>
  )
}
















