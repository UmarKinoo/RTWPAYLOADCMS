'use client'

import { UseFormRegister, FieldErrors, Control } from 'react-hook-form'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useTranslations } from 'next-intl'
import type { CandidateFormData } from '../RegistrationWizard'

interface AccountStepProps {
  register: UseFormRegister<CandidateFormData>
  errors: FieldErrors<CandidateFormData>
  control: Control<CandidateFormData>
}

export function AccountStep({ register, errors }: AccountStepProps) {
  const t = useTranslations('registration.fields')
  
  return (
    <div className="space-y-4">
      <Field data-invalid={!!errors.email}>
        <FieldLabel htmlFor="email">{t('emailAddress')} *</FieldLabel>
        <Input
          id="email"
          type="email"
          {...register('email')}
          placeholder={t('enterEmail')}
        />
        {errors.email && <FieldError>{errors.email.message}</FieldError>}
      </Field>

      <Field data-invalid={!!errors.password}>
        <FieldLabel htmlFor="password">{t('password')} *</FieldLabel>
        <Input
          id="password"
          type="password"
          {...register('password')}
          placeholder={t('enterPassword')}
        />
        {errors.password && <FieldError>{errors.password.message}</FieldError>}
      </Field>

      <Field data-invalid={!!errors.confirmPassword}>
        <FieldLabel htmlFor="confirmPassword">{t('confirmPassword')} *</FieldLabel>
        <Input
          id="confirmPassword"
          type="password"
          {...register('confirmPassword')}
          placeholder={t('confirmPasswordPlaceholder')}
        />
        {errors.confirmPassword && <FieldError>{errors.confirmPassword.message}</FieldError>}
      </Field>
    </div>
  )
}













