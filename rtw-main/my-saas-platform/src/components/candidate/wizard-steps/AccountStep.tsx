'use client'

import { UseFormRegister, FieldErrors, Control } from 'react-hook-form'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { CandidateFormData } from '../RegistrationWizard'

interface AccountStepProps {
  register: UseFormRegister<CandidateFormData>
  errors: FieldErrors<CandidateFormData>
  control: Control<CandidateFormData>
}

export function AccountStep({ register, errors }: AccountStepProps) {
  return (
    <div className="space-y-4">
      <Field data-invalid={!!errors.email}>
        <FieldLabel htmlFor="email">Email Address *</FieldLabel>
        <Input
          id="email"
          type="email"
          {...register('email')}
          placeholder="Enter your email address"
        />
        {errors.email && <FieldError>{errors.email.message}</FieldError>}
      </Field>

      <Field data-invalid={!!errors.password}>
        <FieldLabel htmlFor="password">Password *</FieldLabel>
        <Input
          id="password"
          type="password"
          {...register('password')}
          placeholder="Enter your password (min. 8 characters)"
        />
        {errors.password && <FieldError>{errors.password.message}</FieldError>}
      </Field>

      <Field data-invalid={!!errors.confirmPassword}>
        <FieldLabel htmlFor="confirmPassword">Confirm Password *</FieldLabel>
        <Input
          id="confirmPassword"
          type="password"
          {...register('confirmPassword')}
          placeholder="Confirm your password"
        />
        {errors.confirmPassword && <FieldError>{errors.confirmPassword.message}</FieldError>}
      </Field>
    </div>
  )
}












