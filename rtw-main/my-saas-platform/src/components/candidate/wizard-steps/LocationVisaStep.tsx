'use client'

import { UseFormRegister, FieldErrors, Control } from 'react-hook-form'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { CandidateFormData } from '../RegistrationWizard'

interface LocationVisaStepProps {
  register: UseFormRegister<CandidateFormData>
  errors: FieldErrors<CandidateFormData>
  control: Control<CandidateFormData>
}

export function LocationVisaStep({ register, errors }: LocationVisaStepProps) {
  return (
    <div className="space-y-4">
      <Field data-invalid={!!errors.location}>
        <FieldLabel htmlFor="location">Current Location *</FieldLabel>
        <Input
          id="location"
          {...register('location')}
          placeholder="Enter your current location"
        />
        {errors.location && <FieldError>{errors.location.message}</FieldError>}
      </Field>

      <Field data-invalid={!!errors.visaStatus}>
        <FieldLabel htmlFor="visaStatus">Visa Status *</FieldLabel>
        <select
          id="visaStatus"
          {...register('visaStatus')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">Select Visa Status</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="nearly_expired">Nearly Expired</option>
          <option value="none">None</option>
        </select>
        {errors.visaStatus && <FieldError>{errors.visaStatus.message}</FieldError>}
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field data-invalid={!!errors.visaExpiry}>
          <FieldLabel htmlFor="visaExpiry">Visa Expiry Date (Optional)</FieldLabel>
          <Input
            id="visaExpiry"
            type="date"
            {...register('visaExpiry')}
            placeholder="Enter visa expiry date"
          />
          {errors.visaExpiry && <FieldError>{errors.visaExpiry.message}</FieldError>}
        </Field>

        <Field data-invalid={!!errors.visaProfession}>
          <FieldLabel htmlFor="visaProfession">Job Position in Visa (Optional)</FieldLabel>
          <Input
            id="visaProfession"
            {...register('visaProfession')}
            placeholder="Enter job position in visa"
          />
          {errors.visaProfession && <FieldError>{errors.visaProfession.message}</FieldError>}
        </Field>
      </div>
    </div>
  )
}









