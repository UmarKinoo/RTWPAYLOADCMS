'use client'

import { Control, Controller, FieldErrors } from 'react-hook-form'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Card, CardContent } from '@/components/ui/card'
import type { CandidateFormData } from '../RegistrationWizard'

interface ReviewStepProps {
  formValues: Partial<CandidateFormData>
  sameAsPhone: boolean
  control: Control<CandidateFormData>
  errors: FieldErrors<CandidateFormData>
}

export function ReviewStep({ formValues, sameAsPhone, control, errors }: ReviewStepProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not provided'
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return dateString
    }
  }

  const getVisaStatusLabel = (status?: string) => {
    const labels: Record<string, string> = {
      active: 'Active',
      expired: 'Expired',
      nearly_expired: 'Nearly Expired',
      none: 'None',
    }
    return labels[status || ''] || status || 'Not provided'
  }

  const getGenderLabel = (gender?: string) => {
    return gender === 'male' ? 'Male' : gender === 'female' ? 'Female' : 'Not provided'
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Please review your information</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Review all the information below. If anything needs to be changed, use the Previous button to go back.
        </p>
      </div>

      <div className="space-y-4">
        {/* Account Information */}
        <Card>
          <CardContent className="pt-6">
            <h4 className="font-semibold mb-3">Account Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{formValues.email || 'Not provided'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardContent className="pt-6">
            <h4 className="font-semibold mb-3">Personal Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">First Name:</span>
                <span className="font-medium">{formValues.firstName || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Name:</span>
                <span className="font-medium">{formValues.lastName || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone:</span>
                <span className="font-medium">{formValues.phone || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">WhatsApp:</span>
                <span className="font-medium">
                  {sameAsPhone ? formValues.phone || 'Same as phone' : formValues.whatsapp || 'Not provided'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gender:</span>
                <span className="font-medium">{getGenderLabel(formValues.gender)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date of Birth:</span>
                <span className="font-medium">{formatDate(formValues.dob)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nationality:</span>
                <span className="font-medium">{formValues.nationality || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Languages:</span>
                <span className="font-medium">{formValues.languages || 'Not provided'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Job Role */}
        <Card>
          <CardContent className="pt-6">
            <h4 className="font-semibold mb-3">Job Role</h4>
            <div className="text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Primary Skill:</span>
                <span className="font-medium">{formValues.primarySkill ? 'Selected' : 'Not provided'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Work Experience */}
        <Card>
          <CardContent className="pt-6">
            <h4 className="font-semibold mb-3">Work Experience</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Job Title:</span>
                <span className="font-medium">{formValues.jobTitle || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Experience:</span>
                <span className="font-medium">
                  {formValues.experienceYears !== undefined ? `${formValues.experienceYears} years` : 'Not provided'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Saudi Experience:</span>
                <span className="font-medium">
                  {formValues.saudiExperience !== undefined
                    ? `${formValues.saudiExperience} years`
                    : 'Not provided'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Employer:</span>
                <span className="font-medium">{formValues.currentEmployer || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Availability Date:</span>
                <span className="font-medium">{formatDate(formValues.availabilityDate)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location & Visa */}
        <Card>
          <CardContent className="pt-6">
            <h4 className="font-semibold mb-3">Location & Visa</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Location:</span>
                <span className="font-medium">{formValues.location || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Visa Status:</span>
                <span className="font-medium">{getVisaStatusLabel(formValues.visaStatus)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Visa Expiry:</span>
                <span className="font-medium">{formatDate(formValues.visaExpiry)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Visa Profession:</span>
                <span className="font-medium">{formValues.visaProfession || 'Not provided'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Terms Acceptance */}
      <Field data-invalid={!!errors.termsAccepted}>
        <Controller
          name="termsAccepted"
          control={control}
          render={({ field }) => (
            <div className="flex items-start space-x-2 p-4 border rounded-lg">
              <Checkbox
                id="termsAccepted"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                className="mt-1"
              />
              <label
                htmlFor="termsAccepted"
                className="text-sm font-medium leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                onClick={() => field.onChange(!field.value)}
              >
                I accept the terms and conditions / Agreement Accepted *
              </label>
            </div>
          )}
        />
        {errors.termsAccepted && <FieldError>{errors.termsAccepted.message}</FieldError>}
      </Field>
    </div>
  )
}









