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
  const r = useTranslations('registration.review')
  const tVisa = useTranslations('registration.locationVisa')

  const formatDate = (dateString?: string) => {
    if (!dateString) return r('notProvided')
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return dateString
    }
  }

  const getVisaStatusLabel = (status?: string) => {
    const key = status === 'active' ? 'active' : status === 'expired' ? 'expired' : status === 'nearly_expired' ? 'nearlyExpired' : status === 'none' ? 'noVisa' : null
    return key ? tVisa(key) : (status || r('notProvided'))
  }

  const getGenderLabel = (gender?: string) => {
    return gender === 'male' ? r('male') : gender === 'female' ? r('female') : r('notProvided')
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <FileCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{r('reviewTitle')}</h3>
            <p className="text-sm text-muted-foreground">
              {r('reviewSubtitle')}
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
                <h4 className="font-semibold">{r('accountInfo')}</h4>
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
                  {r('edit')}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{r('email')}</span>
                <span className="font-medium">{formValues.email || r('notProvided')}</span>
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
                <h4 className="font-semibold">{r('personalInfo')}</h4>
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
                  {r('edit')}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{r('firstName')}</span>
                <span className="font-medium">{formValues.firstName || r('notProvided')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{r('lastName')}</span>
                <span className="font-medium">{formValues.lastName || r('notProvided')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{r('phone')}</span>
                <span dir="ltr" className="font-medium">{formValues.phone || r('notProvided')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{r('whatsapp')}</span>
                <span className="font-medium">
                  <span dir="ltr">{sameAsPhone ? formValues.phone || r('sameAsPhone') : formValues.whatsapp || r('notProvided')}</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{r('gender')}</span>
                <span className="font-medium">{getGenderLabel(formValues.gender)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{r('dateOfBirth')}</span>
                <span className="font-medium">{formatDate(formValues.dob)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{r('nationality')}</span>
                <span className="font-medium">{formValues.nationality || r('notProvided')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{r('languages')}</span>
                <span className="font-medium">{formValues.languages || r('notProvided')}</span>
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
                <h4 className="font-semibold">{r('jobRole')}</h4>
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
                  {r('edit')}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
            <div className="text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{r('primarySkill')}</span>
                <span className="font-medium">{formValues.primarySkill ? r('selected') : r('notProvided')}</span>
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
                <h4 className="font-semibold">{r('workExperience')}</h4>
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
                  {r('edit')}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{r('jobTitle')}</span>
                <span className="font-medium">{formValues.jobTitle || r('notProvided')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{r('totalExperience')}</span>
                <span className="font-medium">
                  {formValues.experienceYears !== undefined ? `${formValues.experienceYears} ${r('years')}` : r('notProvided')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{r('saudiExperience')}</span>
                <span className="font-medium">
                  {formValues.saudiExperience !== undefined
                    ? `${formValues.saudiExperience} ${r('years')}`
                    : r('notProvided')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{r('currentEmployer')}</span>
                <span className="font-medium">{formValues.currentEmployer || r('notProvided')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{r('availabilityDate')}</span>
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
                <h4 className="font-semibold">{r('locationVisa')}</h4>
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
                  {r('edit')}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{r('location')}</span>
                <span className="font-medium">
                  {formValues.location
                    ? `${formValues.location}, Saudi Arabia`
                    : r('notProvided')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{r('visaStatus')}</span>
                <span className="font-medium">{getVisaStatusLabel(formValues.visaStatus)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{r('visaExpiry')}</span>
                <span className="font-medium">{formatDate(formValues.visaExpiry)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{r('visaProfession')}</span>
                <span className="font-medium">{formValues.visaProfession || r('notProvided')}</span>
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
















