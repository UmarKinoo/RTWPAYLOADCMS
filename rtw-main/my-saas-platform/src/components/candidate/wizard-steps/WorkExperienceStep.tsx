'use client'

import { UseFormRegister, FieldErrors, Control } from 'react-hook-form'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { CandidateFormData } from '../RegistrationWizard'

interface WorkExperienceStepProps {
  register: UseFormRegister<CandidateFormData>
  errors: FieldErrors<CandidateFormData>
  control: Control<CandidateFormData>
}

export function WorkExperienceStep({ register, errors }: WorkExperienceStepProps) {
  return (
    <div className="space-y-4">
      <Field data-invalid={!!errors.jobTitle}>
        <FieldLabel htmlFor="jobTitle">Job Title *</FieldLabel>
        <Input
          id="jobTitle"
          {...register('jobTitle')}
          placeholder="Enter your current job title"
        />
        {errors.jobTitle && <FieldError>{errors.jobTitle.message}</FieldError>}
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field data-invalid={!!errors.experienceYears}>
          <FieldLabel htmlFor="experienceYears">Total Experience (Years) *</FieldLabel>
          <Input
            id="experienceYears"
            type="number"
            {...register('experienceYears', { valueAsNumber: true })}
            placeholder="Enter years of experience"
            min={0}
          />
          {errors.experienceYears && <FieldError>{errors.experienceYears.message}</FieldError>}
        </Field>

        <Field data-invalid={!!errors.saudiExperience}>
          <FieldLabel htmlFor="saudiExperience">Experience in Saudi Arabia (Years) *</FieldLabel>
          <Input
            id="saudiExperience"
            type="number"
            {...register('saudiExperience', { valueAsNumber: true })}
            placeholder="Enter years of experience in Saudi"
            min={0}
          />
          {errors.saudiExperience && <FieldError>{errors.saudiExperience.message}</FieldError>}
        </Field>
      </div>

      <Field data-invalid={!!errors.currentEmployer}>
        <FieldLabel htmlFor="currentEmployer">Current Employer (Optional)</FieldLabel>
        <Input
          id="currentEmployer"
          {...register('currentEmployer')}
          placeholder="Enter current employer name"
        />
        {errors.currentEmployer && <FieldError>{errors.currentEmployer.message}</FieldError>}
      </Field>

      <Field data-invalid={!!errors.availabilityDate}>
        <FieldLabel htmlFor="availabilityDate">Date Available to Join *</FieldLabel>
        <Input
          id="availabilityDate"
          type="date"
          {...register('availabilityDate')}
          placeholder="Select availability date"
        />
        {errors.availabilityDate && <FieldError>{errors.availabilityDate.message}</FieldError>}
      </Field>
    </div>
  )
}









