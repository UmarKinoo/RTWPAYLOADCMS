'use client'

import React, { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Check, ChevronLeft, ChevronRight, Mail, User, Briefcase, Award, MapPin, FileCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { HomepageNavbar } from '@/components/homepage/Navbar'
import { registerCandidate } from '@/lib/candidate'
import { validatePassword, validateEmail } from '@/lib/validation'
import { AccountStep } from './wizard-steps/AccountStep'
import { PersonalInfoStep } from './wizard-steps/PersonalInfoStep'
import { JobRoleStep } from './wizard-steps/JobRoleStep'
import { WorkExperienceStep } from './wizard-steps/WorkExperienceStep'
import { LocationVisaStep } from './wizard-steps/LocationVisaStep'
import { ReviewStep } from './wizard-steps/ReviewStep'
import { PhoneVerification } from '@/components/auth/phone-verification'
import { cn } from '@/lib/utils'

const candidateSchema = z
  .object({
    // Identity
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    phone: z.string().min(1, 'Phone number is required'),
    whatsapp: z.string().optional(),
    sameAsPhone: z.boolean().optional(),

    // Smart Matrix
    primarySkill: z.string().min(1, 'Please select your job role'),

    // Demographics
    gender: z.enum(['male', 'female'], { message: 'Gender is required' }),
    dob: z.string().min(1, 'Date of birth is required'),
    nationality: z.string().min(1, 'Nationality is required'),
    languages: z.string().min(1, 'Languages are required'),
    currentlyInKSA: z.boolean().refine((val) => val === true, {
      message: 'Please confirm you are currently located in Saudi Arabia',
    }),

    // Work
    jobTitle: z.string().min(1, 'Job title is required'),
    experienceYears: z.number().min(0, 'Experience must be 0 or greater'),
    saudiExperience: z.number().min(0, 'Saudi experience must be 0 or greater'),
    currentEmployer: z.string().optional(),
    availabilityDate: z.string().min(1, 'Availability date is required'),

    // Visa
    location: z.string().min(1, 'Location is required'),
    visaStatus: z.enum(['active', 'expired', 'nearly_expired', 'none'], {
      message: 'Visa status is required',
    }),
    visaExpiry: z.string().optional(),
    visaProfession: z.string().optional(),

    // Consent checkboxes – one per statement (same as employer)
    acceptPrivacyTerms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the Privacy Policy and Terms and Conditions',
    }),
    acceptDataConsent: z.boolean().refine((val) => val === true, {
      message: 'You must consent to data collection and publication',
    }),
    acceptPlatformDisclaimer: z.boolean().refine((val) => val === true, {
      message: 'You must acknowledge the platform disclaimer',
    }),
  })
  .refine((data) => validatePassword(data.password).valid, {
    message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
    path: ['password'],
  })
  .refine((data) => validateEmail(data.email).valid, {
    message: 'Invalid email address',
    path: ['email'],
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type CandidateFormData = z.infer<typeof candidateSchema>

export function RegistrationWizard() {
  const t = useTranslations('registration')
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isPending, setIsPending] = useState(false)
  const [sameAsPhone, setSameAsPhone] = useState(false)
  const [showPhoneVerification, setShowPhoneVerification] = useState(false)
  const [candidateId, setCandidateId] = useState<string | undefined>(undefined)
  const [registrationData, setRegistrationData] = useState<CandidateFormData | null>(null)
  const navigatedToStep6At = useRef<number>(0)

  const STEPS = [
    { id: 1, title: t('steps.account.title'), description: t('steps.account.description'), shortTitle: t('steps.account.shortTitle'), stepperTitle: t('steps.account.stepperTitle'), icon: Mail },
    { id: 2, title: t('steps.personalInfo.title'), description: t('steps.personalInfo.description'), shortTitle: t('steps.personalInfo.shortTitle'), stepperTitle: t('steps.personalInfo.stepperTitle'), icon: User },
    { id: 3, title: t('steps.jobRole.title'), description: t('steps.jobRole.description'), shortTitle: t('steps.jobRole.shortTitle'), stepperTitle: t('steps.jobRole.stepperTitle'), icon: Briefcase },
    { id: 4, title: t('steps.experience.title'), description: t('steps.experience.description'), shortTitle: t('steps.experience.shortTitle'), stepperTitle: t('steps.experience.stepperTitle'), icon: Award },
    { id: 5, title: t('steps.locationVisa.title'), description: t('steps.locationVisa.description'), shortTitle: t('steps.locationVisa.shortTitle'), stepperTitle: t('steps.locationVisa.stepperTitle'), icon: MapPin },
    { id: 6, title: t('steps.review.title'), description: t('steps.review.description'), shortTitle: t('steps.review.shortTitle'), stepperTitle: t('steps.review.stepperTitle'), icon: FileCheck },
  ]

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    trigger,
    clearErrors,
    formState: { errors },
  } = useForm<CandidateFormData>({
    resolver: zodResolver(candidateSchema),
    mode: 'onChange',
    defaultValues: {
      sameAsPhone: false,
      currentlyInKSA: false,
      acceptPrivacyTerms: false,
      acceptDataConsent: false,
      acceptPlatformDisclaimer: false,
    },
  })

  const phone = watch('phone')
  const primarySkill = watch('primarySkill')
  const password = watch('password')
  const confirmPassword = watch('confirmPassword')
  const formValues = watch()
  
  // Check if passwords match for step 1 validation
  const passwordsMatch = password && confirmPassword ? password === confirmPassword : true

  // Update WhatsApp when "same as phone" is checked
  React.useEffect(() => {
    if (sameAsPhone && phone) {
      setValue('whatsapp', phone)
    }
  }, [sameAsPhone, phone, setValue])

  // Don't show consent-checkbox errors until we're on step 6
  React.useEffect(() => {
    if (currentStep !== 6) {
      clearErrors(['acceptPrivacyTerms', 'acceptDataConsent', 'acceptPlatformDisclaimer'])
    }
  }, [currentStep, clearErrors])

  // Don't show currentlyInKSA error until we're on step 2
  React.useEffect(() => {
    if (currentStep !== 2) {
      clearErrors(['currentlyInKSA'])
    }
  }, [currentStep, clearErrors])

  const validateStep = async (step: number): Promise<boolean> => {
    const fieldsToValidate: (keyof CandidateFormData)[] = {
      1: ['email', 'password', 'confirmPassword'],
      2: ['firstName', 'lastName', 'phone', 'gender', 'dob', 'nationality', 'languages', 'location', 'currentlyInKSA'],
      3: ['primarySkill'],
      4: ['jobTitle', 'experienceYears', 'saudiExperience', 'availabilityDate'],
      5: ['visaStatus'],
      6: ['acceptPrivacyTerms', 'acceptDataConsent', 'acceptPlatformDisclaimer'],
    }[step] as (keyof CandidateFormData)[]

    const result = await trigger(fieldsToValidate)
    return result
  }

  const handleNext = async () => {
    // Additional validation for step 1: check password match
    if (currentStep === 1) {
      if (password && confirmPassword && !passwordsMatch) {
        // Trigger validation to show error
        await trigger('confirmPassword')
        return
      }
    }
    
    const isValid = await validateStep(currentStep)
    if (isValid && currentStep < STEPS.length) {
      if (currentStep === 5) {
        navigatedToStep6At.current = Date.now()
      }
      setCurrentStep(currentStep + 1)
      // Scroll to top on step change
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
  
  const handleEditStep = (step: number) => {
    setCurrentStep(step)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleStepClick = (stepNumber: number) => {
    // Allow navigation to current step or any completed step
    if (stepNumber <= currentStep) {
      setCurrentStep(stepNumber)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const onSubmit = async (data: CandidateFormData) => {
    console.log('Form submission started', { data })

    // All three consent checkboxes are validated by schema
    setIsPending(true)

    try {
      console.log('Calling registerCandidate with data:', {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        primarySkill: data.primarySkill,
        termsAccepted: true,
      })

      const result = await registerCandidate({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        phone: data.phone,
        whatsapp: sameAsPhone ? data.phone : data.whatsapp || data.phone,
        primarySkill: data.primarySkill,
        gender: data.gender,
        dob: data.dob,
        nationality: data.nationality,
        languages: data.languages,
        jobTitle: data.jobTitle,
        experienceYears: data.experienceYears,
        saudiExperience: data.saudiExperience,
        currentEmployer: data.currentEmployer,
        availabilityDate: data.availabilityDate,
        location: data.location,
        visaStatus: data.visaStatus,
        visaExpiry: data.visaExpiry,
        visaProfession: data.visaProfession,
        termsAccepted: true, // all three consent checkboxes were accepted
      })

      console.log('Registration result:', result)

      if (result.success && result.candidateId) {
        toast.success('Registration Successful!', {
          description: 'Please verify your phone number to continue.',
        })
        setCandidateId(result.candidateId)
        setRegistrationData(data) // Store form data for login after verification
        setShowPhoneVerification(true)
        // Do NOT set isPending(false) here, as PhoneVerification will manage its own loading
      } else {
        toast.error(t('registrationFailed'), {
          description: result.error || t('pleaseTryAgainLater'),
        })
        setIsPending(false)
      }
    } catch (error) {
      console.error('Registration error:', error)
      toast.error(t('registrationFailed'), {
        description: error instanceof Error ? error.message : t('somethingWentWrong'),
      })
      setIsPending(false)
    }
  }

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (navigatedToStep6At.current && Date.now() - navigatedToStep6At.current < 400) {
      navigatedToStep6At.current = 0
      e.preventDefault()
      return
    }
    handleSubmit(onSubmit, handleFormError)(e)
  }

  const handleFormError = (errors: any) => {
    console.error('Form validation errors:', errors)
    // Show first error
    const firstError = Object.values(errors)[0] as any
    if (firstError?.message) {
      toast.error('Validation Error', {
        description: firstError.message,
      })
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <AccountStep
            register={register}
            errors={errors}
            control={control}
          />
        )
      case 2:
        return (
          <PersonalInfoStep
            register={register}
            errors={errors}
            control={control}
            sameAsPhone={sameAsPhone}
            setSameAsPhone={setSameAsPhone}
            phone={phone}
            setValue={setValue}
          />
        )
      case 3:
        return (
          <JobRoleStep
            primarySkill={primarySkill}
            setValue={setValue}
            error={errors.primarySkill?.message}
          />
        )
      case 4:
        return (
          <WorkExperienceStep
            register={register}
            errors={errors}
            control={control}
          />
        )
      case 5:
        return (
          <LocationVisaStep
            register={register}
            errors={errors}
            control={control}
            setValue={setValue}
          />
        )
      case 6:
        return (
          <ReviewStep
            formValues={formValues}
            sameAsPhone={sameAsPhone}
            control={control}
            errors={errors}
            onEditStep={handleEditStep}
          />
        )
      default:
        return null
    }
  }

  const progressPercentage = (currentStep / STEPS.length) * 100

  // Show phone verification step after successful registration
  if (showPhoneVerification && candidateId && registrationData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col" dir="ltr">
        <HomepageNavbar />
        
        <main className="flex-1 pt-24 sm:pt-28 md:pt-32 pb-8 sm:pb-12">
          <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
            {/* Progress Bar - Show 100% for verification step */}
            <div className="mb-6 sm:mb-8">
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full bg-[#4644b8] transition-all duration-300 ease-out"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Title and Description */}
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[#16252d] mb-3 sm:mb-4 leading-tight">
                Verify Your Phone Number
              </h2>
              <p className="text-sm sm:text-base text-[#a5a5a5] leading-relaxed px-2">
                We've sent a verification code to your phone. Please enter it below to complete your registration.
              </p>
            </div>

            {/* Phone Verification Component */}
            <Card className="w-full">
              <CardContent className="pt-6">
                <PhoneVerification
                  phone={registrationData.phone}
                  userId={candidateId}
                  userCollection="candidates"
                  onVerified={async () => {
                    toast.success('Phone Verified!', {
                      description: 'Your phone number has been verified successfully.',
                    })
                    // Log in the candidate after successful phone verification
                    try {
                      // Use the loginUser server action
                      const { loginUser } = await import('@/lib/auth')
                      const loginResult = await loginUser({
                        email: registrationData.email,
                        password: registrationData.password,
                        collection: 'candidates',
                      })

                      if (loginResult.success) {
                        // Redirect to dashboard (which will route to candidate dashboard)
                        router.push('/dashboard')
                        router.refresh() // Refresh to update auth state
                      } else {
                        toast.error('Verification successful, but login failed. Please log in manually.')
                        router.push('/login')
                      }
                    } catch (error) {
                      console.error('Error logging in after verification:', error)
                      toast.error('Verification successful, but login failed. Please log in manually.')
                      router.push('/login')
                    }
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir="ltr">
      <HomepageNavbar />
      
      <main className="flex-1 pt-24 sm:pt-28 md:pt-32 pb-8 sm:pb-12">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
          {/* Header */}
          <div className="mb-6 sm:mb-8 text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#16252d] mb-2">
              {t('title')}
            </h1>
            <p className="text-sm sm:text-base text-[#757575]">
              {t('stepOf', { current: currentStep, total: STEPS.length })}: {STEPS[currentStep - 1].description}
            </p>
          </div>

          {/* Progress Bar - Using shadcn/ui Progress */}
          <div className="mb-8 max-w-4xl mx-auto space-y-2">
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between items-center">
              <Label className="text-xs text-muted-foreground font-normal">
                {Math.round(progressPercentage)}% {t('complete')}
              </Label>
              <Badge variant="outline" className="text-xs">
                {t('stepOf', { current: currentStep, total: STEPS.length })}
              </Badge>
            </div>
          </div>

          {/* Main Layout: Stepper Left, Form Right */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Stepper - Desktop (Left Side, Vertical) */}
            <aside className="hidden lg:block w-full lg:w-72 flex-shrink-0">
              <div className="sticky top-32">
                <Card className="p-6">
                  <div className="relative">
                    {/* Vertical line connector - starts and ends at circle centers */}
                    {STEPS.length > 1 && (
                      <>
                        {/* Background line - from center of first circle to center of last circle */}
                        <div 
                          className="absolute left-[20px] w-px bg-muted"
                          style={{
                            top: '20px', // Center of first circle (w-10 = 40px, center = 20px)
                            bottom: '20px', // Center of last circle
                          }}
                        />
                        {/* Progress line - only shows for completed steps */}
                        {currentStep > 1 && (
                          <div
                            className="absolute left-[20px] w-px bg-primary transition-all duration-300"
                            style={{ 
                              top: '20px', // Start at center of first circle
                              height: currentStep === STEPS.length 
                                ? 'calc(100% - 40px)' // Full height minus top and bottom (20px each)
                                : `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` // Proportional height
                            }}
                          />
                        )}
                      </>
                    )}
                    
                    <div className="space-y-8 relative">
                      {STEPS.map((step, index) => {
                        const StepIcon = step.icon
                        const isClickable = step.id <= currentStep
                        const isCompleted = currentStep > step.id
                        const isCurrent = currentStep === step.id
                        
                        return (
                          <button
                            key={step.id}
                            type="button"
                            onClick={() => handleStepClick(step.id)}
                            disabled={!isClickable}
                            className={cn(
                              "flex items-start gap-4 w-full text-left transition-all duration-200 rounded-lg p-2 -ml-2",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:rounded-lg",
                              isClickable && "cursor-pointer hover:bg-accent/50",
                              !isClickable && "cursor-not-allowed opacity-50"
                            )}
                            aria-label={`Go to step ${step.id}: ${step.stepperTitle}`}
                          >
                            {/* Circle with Icon */}
                            <div
                              className={cn(
                                "relative w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200 flex-shrink-0 z-10",
                                isCompleted
                                  ? 'bg-primary border-primary text-primary-foreground opacity-100'
                                  : isCurrent
                                  ? 'border-primary bg-primary text-primary-foreground opacity-100'
                                  : 'border-muted text-muted-foreground bg-background opacity-100'
                              )}
                            >
                              {isCompleted ? (
                                <Check className="w-5 h-5" />
                              ) : (
                                <StepIcon className="w-5 h-5" />
                              )}
                            </div>
                            {/* Title and Description */}
                            <div className="flex-1 pt-1 space-y-1">
                              <Label
                                className={cn(
                                  "text-sm transition-colors duration-200",
                                  isCompleted
                                    ? 'text-primary'
                                    : isCurrent
                                    ? 'text-foreground font-semibold'
                                    : 'text-muted-foreground'
                                )}
                              >
                                {step.stepperTitle}
                              </Label>
                              {isCurrent && (
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  {step.description}
                                </p>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </Card>
              </div>
            </aside>

            {/* Stepper - Mobile (Horizontal) */}
            <div className="lg:hidden mb-6">
              <Card className="p-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 px-1">
                  {STEPS.map((step, index) => {
                    const StepIcon = step.icon
                    const isClickable = step.id <= currentStep
                    const isCompleted = currentStep > step.id
                    const isCurrent = currentStep === step.id
                    
                    return (
                      <React.Fragment key={step.id}>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStepClick(step.id)}
                            disabled={!isClickable}
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-200 opacity-100",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                              isClickable && "cursor-pointer hover:scale-110",
                              !isClickable && "cursor-not-allowed opacity-50",
                              isCompleted
                                ? 'bg-primary border-primary text-primary-foreground'
                                : isCurrent
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-muted bg-background text-muted-foreground'
                            )}
                            aria-label={`Go to step ${step.id}: ${step.shortTitle}`}
                          >
                            {isCompleted ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <StepIcon className="w-4 h-4" />
                            )}
                          </button>
                          {isCurrent && (
                            <button
                              type="button"
                              onClick={() => handleStepClick(step.id)}
                              className="text-xs font-semibold hover:text-primary transition-colors cursor-pointer focus-visible:outline-none"
                              aria-label={`Go to step ${step.id}: ${step.shortTitle}`}
                            >
                              {step.shortTitle}
                            </button>
                          )}
                        </div>
                        {index < STEPS.length - 1 && (
                          <Separator
                            orientation="vertical"
                            className={cn(
                              "h-4 w-px transition-colors duration-200",
                              isCompleted ? 'bg-primary' : 'bg-muted'
                            )}
                          />
                        )}
                      </React.Fragment>
                    )
                  })}
                </div>
              </Card>
            </div>

            {/* Form Card - Right Side */}
            <div className="flex-1">
              <form onSubmit={handleFormSubmit}>
                <Card>
                  <CardHeader className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-2xl">
                          {STEPS[currentStep - 1].title}
                        </CardTitle>
                        <CardDescription>
                          {STEPS[currentStep - 1].description}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="hidden sm:flex">
                        {t('stepOf', { current: currentStep, total: STEPS.length })}
                      </Badge>
                    </div>
                  </CardHeader>
                  <Separator />
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      {renderStep()}
                    </div>
                  </CardContent>
                </Card>

                {/* Navigation Buttons */}
                <div className="flex flex-col-reverse sm:flex-row justify-between gap-4 mt-8">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 1}
                    className="w-full sm:w-auto"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    {t('previous')}
                  </Button>

                  {currentStep < STEPS.length ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      disabled={currentStep === 1 && !!password && !!confirmPassword && !passwordsMatch}
                      className="w-full sm:w-auto"
                    >
                      {t('next')}
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isPending}
                      size="lg"
                      className="w-full sm:w-auto"
                    >
                      {isPending ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          {t('registering')}
                        </span>
                      ) : (
                        t('completeRegistration')
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
