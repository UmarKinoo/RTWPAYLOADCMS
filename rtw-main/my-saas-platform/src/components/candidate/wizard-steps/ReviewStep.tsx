'use client'

import { Control, Controller, FieldErrors } from 'react-hook-form'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldError } from '@/components/ui/field'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit, User, Mail, Briefcase, MapPin, FileCheck, ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { CandidateFormData } from '../RegistrationWizard'

interface ReviewStepProps {
  formValues: Partial<CandidateFormData>
  sameAsPhone: boolean
  control: Control<CandidateFormData>
  errors: FieldErrors<CandidateFormData>
  onEditStep?: (step: number) => void
}

export function ReviewStep({ formValues, sameAsPhone, control, errors, onEditStep }: ReviewStepProps) {
  const t = useTranslations('registration.legalStatements')
  
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
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <FileCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Please review your information</h3>
            <p className="text-sm text-muted-foreground">
              Click Edit to modify any section
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Account Information */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                <h4 className="font-semibold">Account Information</h4>
              </div>
              {onEditStep && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditStep(1)}
                  className="h-8"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{formValues.email || 'Not provided'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                <h4 className="font-semibold">Personal Information</h4>
              </div>
              {onEditStep && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditStep(2)}
                  className="h-8 hover:bg-[#4644b8]/10 hover:text-[#4644b8] transition-colors duration-200"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                <h4 className="font-semibold">Job Role</h4>
              </div>
              {onEditStep && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditStep(3)}
                  className="h-8 hover:bg-[#4644b8]/10 hover:text-[#4644b8] transition-colors duration-200"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
            <div className="text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Primary Skill:</span>
                <span className="font-medium">{formValues.primarySkill ? 'Selected' : 'Not provided'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Work Experience */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                <h4 className="font-semibold">Work Experience</h4>
              </div>
              {onEditStep && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditStep(4)}
                  className="h-8 hover:bg-[#4644b8]/10 hover:text-[#4644b8] transition-colors duration-200"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <h4 className="font-semibold">Location & Visa</h4>
              </div>
              {onEditStep && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditStep(5)}
                  className="h-8 hover:bg-[#4644b8]/10 hover:text-[#4644b8] transition-colors duration-200"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Location:</span>
                <span className="font-medium">
                  {formValues.location
                    ? `${formValues.location}, Saudi Arabia`
                    : 'Not provided'}
                </span>
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

      {/* Consent checkboxes – one per statement (same labels as employer) */}
      <Field data-invalid={!!errors.acceptPrivacyTerms}>
        <Controller
          name="acceptPrivacyTerms"
          control={control}
          render={({ field }) => (
            <div
              className={`flex items-start space-x-3 p-4 border-2 rounded-lg transition-all duration-200 ${
                field.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
            >
              <Checkbox
                id="acceptPrivacyTerms"
                checked={field.value || false}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                className="mt-0.5"
              />
              <label
                htmlFor="acceptPrivacyTerms"
                className="text-sm font-medium leading-relaxed cursor-pointer select-none flex-1"
              >
                {t('acceptPrivacyTerms')} *
              </label>
            </div>
          )}
        />
        {errors.acceptPrivacyTerms && (
          <FieldError>{errors.acceptPrivacyTerms.message}</FieldError>
        )}
      </Field>

      <Field data-invalid={!!errors.acceptDataConsent}>
        <Controller
          name="acceptDataConsent"
          control={control}
          render={({ field }) => (
            <div
              className={`flex items-start space-x-3 p-4 border-2 rounded-lg transition-all duration-200 ${
                field.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
            >
              <Checkbox
                id="acceptDataConsent"
                checked={field.value || false}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                className="mt-0.5"
              />
              <label
                htmlFor="acceptDataConsent"
                className="text-sm font-medium leading-relaxed cursor-pointer select-none flex-1"
              >
                {t('acceptDataConsent')} *
              </label>
            </div>
          )}
        />
        {errors.acceptDataConsent && (
          <FieldError>{errors.acceptDataConsent.message}</FieldError>
        )}
      </Field>

      <Field data-invalid={!!errors.acceptPlatformDisclaimer}>
        <Controller
          name="acceptPlatformDisclaimer"
          control={control}
          render={({ field }) => (
            <div
              className={`flex items-start space-x-3 p-4 border-2 rounded-lg transition-all duration-200 ${
                field.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
            >
              <Checkbox
                id="acceptPlatformDisclaimer"
                checked={field.value || false}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                className="mt-0.5"
              />
              <label
                htmlFor="acceptPlatformDisclaimer"
                className="text-sm font-medium leading-relaxed cursor-pointer select-none flex-1"
              >
                {t('acceptPlatformDisclaimer')} *
              </label>
            </div>
          )}
        />
        {errors.acceptPlatformDisclaimer && (
          <FieldError>{errors.acceptPlatformDisclaimer.message}</FieldError>
        )}
      </Field>
    </div>
  )
}
















