'use client'

import { useState } from 'react'
import { UseFormRegister, FieldErrors, Control, useWatch } from 'react-hook-form'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { CandidateFormData } from '../RegistrationWizard'

interface AccountStepProps {
  register: UseFormRegister<CandidateFormData>
  errors: FieldErrors<CandidateFormData>
  control: Control<CandidateFormData>
}

export function AccountStep({ register, errors, control }: AccountStepProps) {
  const t = useTranslations('registration.fields')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const password = useWatch({ control, name: 'password' })
  const confirmPassword = useWatch({ control, name: 'confirmPassword' })
  
  // Check if passwords match (only show error if both have values)
  const passwordsMatch = password && confirmPassword ? password === confirmPassword : true
  const showPasswordMismatch = password && confirmPassword && !passwordsMatch
  
  return (
    <div className="space-y-6">
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
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            {...register('password')}
            placeholder={t('enterPassword')}
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
        {errors.password && <FieldError>{errors.password.message}</FieldError>}
      </Field>

      <Field data-invalid={!!errors.confirmPassword || showPasswordMismatch}>
        <FieldLabel htmlFor="confirmPassword">{t('confirmPassword')} *</FieldLabel>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            {...register('confirmPassword')}
            placeholder={t('confirmPasswordPlaceholder')}
            className={cn('pr-10', showPasswordMismatch && 'border-destructive')}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
        {errors.confirmPassword && <FieldError>{errors.confirmPassword.message}</FieldError>}
        {showPasswordMismatch && !errors.confirmPassword && (
          <FieldError>Passwords do not match</FieldError>
        )}
      </Field>
    </div>
  )
}













