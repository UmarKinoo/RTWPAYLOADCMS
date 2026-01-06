'use client'

import { UseFormRegister, FieldErrors, Control, UseFormSetValue } from 'react-hook-form'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import type { CandidateFormData } from '../RegistrationWizard'

interface PersonalInfoStepProps {
  register: UseFormRegister<CandidateFormData>
  errors: FieldErrors<CandidateFormData>
  control: Control<CandidateFormData>
  sameAsPhone: boolean
  setSameAsPhone: (value: boolean) => void
  phone: string
  setValue: UseFormSetValue<CandidateFormData>
}

export function PersonalInfoStep({
  register,
  errors,
  sameAsPhone,
  setSameAsPhone,
  phone,
  setValue,
}: PersonalInfoStepProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field data-invalid={!!errors.firstName}>
          <FieldLabel htmlFor="firstName">First Name *</FieldLabel>
          <Input
            id="firstName"
            {...register('firstName')}
            placeholder="Enter your first name"
          />
          {errors.firstName && <FieldError>{errors.firstName.message}</FieldError>}
        </Field>

        <Field data-invalid={!!errors.lastName}>
          <FieldLabel htmlFor="lastName">Last Name *</FieldLabel>
          <Input
            id="lastName"
            {...register('lastName')}
            placeholder="Enter your last name"
          />
          {errors.lastName && <FieldError>{errors.lastName.message}</FieldError>}
        </Field>
      </div>

      <Field data-invalid={!!errors.phone}>
        <FieldLabel htmlFor="phone">Phone Number *</FieldLabel>
        <Input
          id="phone"
          {...register('phone')}
          placeholder="Enter phone number"
        />
        {errors.phone && <FieldError>{errors.phone.message}</FieldError>}
      </Field>

      <Field data-invalid={!!errors.whatsapp}>
        <FieldLabel htmlFor="whatsapp">WhatsApp Number</FieldLabel>
        <div className="space-y-2">
          <Input
            id="whatsapp"
            {...register('whatsapp')}
            placeholder="Enter WhatsApp number if different"
            disabled={sameAsPhone}
          />
          <div className="flex items-center space-x-2">
            <Checkbox
              id="sameAsPhone"
              checked={sameAsPhone}
              onCheckedChange={(checked) => {
                setSameAsPhone(checked === true)
                if (checked) {
                  setValue('whatsapp', phone || '')
                }
              }}
            />
            <label
              htmlFor="sameAsPhone"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Same as Phone
            </label>
          </div>
        </div>
        {errors.whatsapp && <FieldError>{errors.whatsapp.message}</FieldError>}
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field data-invalid={!!errors.gender}>
          <FieldLabel htmlFor="gender">Gender *</FieldLabel>
          <select
            id="gender"
            {...register('gender')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          {errors.gender && <FieldError>{errors.gender.message}</FieldError>}
        </Field>

        <Field data-invalid={!!errors.dob}>
          <FieldLabel htmlFor="dob">Date of Birth *</FieldLabel>
          <Input
            id="dob"
            type="date"
            {...register('dob')}
            placeholder="Enter date of birth"
          />
          {errors.dob && <FieldError>{errors.dob.message}</FieldError>}
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field data-invalid={!!errors.nationality}>
          <FieldLabel htmlFor="nationality">Nationality *</FieldLabel>
          <Input
            id="nationality"
            {...register('nationality')}
            placeholder="Enter your nationality"
          />
          {errors.nationality && <FieldError>{errors.nationality.message}</FieldError>}
        </Field>

        <Field data-invalid={!!errors.languages}>
          <FieldLabel htmlFor="languages">Languages *</FieldLabel>
          <Input
            id="languages"
            {...register('languages')}
            placeholder="Languages speaking/reading and writing"
          />
          {errors.languages && <FieldError>{errors.languages.message}</FieldError>}
        </Field>
      </div>
    </div>
  )
}
















