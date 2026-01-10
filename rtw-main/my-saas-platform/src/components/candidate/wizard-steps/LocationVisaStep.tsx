'use client'

import { useState } from 'react'
import { UseFormRegister, FieldErrors, Control, UseFormSetValue, Controller, useWatch } from 'react-hook-form'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarIcon, Shield, AlertTriangle, Clock, Ban } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { CandidateFormData } from '../RegistrationWizard'

interface LocationVisaStepProps {
  register: UseFormRegister<CandidateFormData>
  errors: FieldErrors<CandidateFormData>
  control: Control<CandidateFormData>
  setValue: UseFormSetValue<CandidateFormData>
}

export function LocationVisaStep({ register, errors, control, setValue }: LocationVisaStepProps) {
  const watchedVisaExpiry = useWatch({ control, name: 'visaExpiry' })
  const [visaExpiryDate, setVisaExpiryDate] = useState<Date | undefined>(
    watchedVisaExpiry ? new Date(watchedVisaExpiry) : undefined
  )

  const handleVisaExpiryChange = (date: Date | undefined) => {
    setVisaExpiryDate(date)
    if (date) {
      setValue('visaExpiry', format(date, 'yyyy-MM-dd'), { shouldValidate: true })
    } else {
      setValue('visaExpiry', '', { shouldValidate: true })
    }
  }

  const visaStatusOptions = [
    { value: 'active', label: 'Active', icon: Shield, color: 'text-green-600' },
    { value: 'nearly_expired', label: 'Nearly Expired', icon: Clock, color: 'text-amber-600' },
    { value: 'expired', label: 'Expired', icon: AlertTriangle, color: 'text-red-600' },
    { value: 'none', label: 'No Visa', icon: Ban, color: 'text-gray-600' },
  ]

  return (
    <div className="space-y-6">
      {/* Visa Status with Icons */}
      <Field data-invalid={!!errors.visaStatus}>
        <FieldLabel htmlFor="visaStatus">Visa Status *</FieldLabel>
        <Controller
          name="visaStatus"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full h-12">
                <SelectValue placeholder="Select your visa status" />
              </SelectTrigger>
              <SelectContent>
                {visaStatusOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Icon className={cn('h-4 w-4', option.color)} />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          )}
        />
        {errors.visaStatus && <FieldError>{errors.visaStatus.message}</FieldError>}
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field data-invalid={!!errors.visaExpiry}>
          <FieldLabel htmlFor="visaExpiry">Visa Expiry Date (Optional)</FieldLabel>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal h-12',
                  !visaExpiryDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {visaExpiryDate ? format(visaExpiryDate, 'PPP') : 'Select expiry date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={visaExpiryDate}
                onSelect={handleVisaExpiryChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {errors.visaExpiry && <FieldError>{errors.visaExpiry.message}</FieldError>}
        </Field>

        <Field data-invalid={!!errors.visaProfession}>
          <FieldLabel htmlFor="visaProfession">Job Position in Visa (Optional)</FieldLabel>
          <Input
            id="visaProfession"
            {...register('visaProfession')}
            placeholder="Enter job position in visa"
            className="h-12"
          />
          {errors.visaProfession && <FieldError>{errors.visaProfession.message}</FieldError>}
        </Field>
      </div>
    </div>
  )
}
















