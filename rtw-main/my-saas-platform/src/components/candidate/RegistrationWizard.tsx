'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { HomepageNavbar } from '@/components/homepage/Navbar'
import { Footer } from '@/components/homepage/blocks/Footer'
import { registerCandidate } from '@/lib/candidate'
import { validatePassword, validateEmail } from '@/lib/validation'
import { AccountStep } from './wizard-steps/AccountStep'
import { PersonalInfoStep } from './wizard-steps/PersonalInfoStep'
import { JobRoleStep } from './wizard-steps/JobRoleStep'
import { WorkExperienceStep } from './wizard-steps/WorkExperienceStep'
import { LocationVisaStep } from './wizard-steps/LocationVisaStep'
import { ReviewStep } from './wizard-steps/ReviewStep'
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

    // Terms
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
  })
  .refine((data) => validatePassword(data.password).valid, {
    message: validatePassword('').error || 'Invalid password',
    path: ['password'],
  })
  .refine((data) => validateEmail(data.email).valid, {
    message: validateEmail('').error || 'Invalid email',
    path: ['email'],
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type CandidateFormData = z.infer<typeof candidateSchema>

const STEPS = [
  { id: 1, title: 'Account', description: 'Create your account', shortTitle: 'Account', stepperTitle: 'Account' },
  { id: 2, title: 'Personal Info', description: 'Your personal details', shortTitle: 'Personal', stepperTitle: 'Personal' },
  { id: 3, title: 'Job Role', description: 'Select your role', shortTitle: 'Job Role', stepperTitle: 'Job Role' },
  { id: 4, title: 'Experience', description: 'Work experience', shortTitle: 'Experience', stepperTitle: 'Experience' },
  { id: 5, title: 'Location & Visa', description: 'Location and visa info', shortTitle: 'Location', stepperTitle: 'Location' },
  { id: 6, title: 'Review', description: 'Review and submit', shortTitle: 'Review', stepperTitle: 'Review' },
]

export function RegistrationWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isPending, setIsPending] = useState(false)
  const [sameAsPhone, setSameAsPhone] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    trigger,
    formState: { errors },
  } = useForm<CandidateFormData>({
    resolver: zodResolver(candidateSchema),
    mode: 'onChange',
    defaultValues: {
      sameAsPhone: false,
      termsAccepted: false,
    },
  })

  const phone = watch('phone')
  const primarySkill = watch('primarySkill')
  const formValues = watch()

  // Update WhatsApp when "same as phone" is checked
  React.useEffect(() => {
    if (sameAsPhone && phone) {
      setValue('whatsapp', phone)
    }
  }, [sameAsPhone, phone, setValue])

  const validateStep = async (step: number): Promise<boolean> => {
    const fieldsToValidate: (keyof CandidateFormData)[] = {
      1: ['email', 'password', 'confirmPassword'],
      2: ['firstName', 'lastName', 'phone', 'gender', 'dob', 'nationality', 'languages'],
      3: ['primarySkill'],
      4: ['jobTitle', 'experienceYears', 'saudiExperience', 'availabilityDate'],
      5: ['location', 'visaStatus'],
      6: ['termsAccepted'],
    }[step] as (keyof CandidateFormData)[]

    const result = await trigger(fieldsToValidate)
    return result
  }

  const handleNext = async () => {
    const isValid = await validateStep(currentStep)
    if (isValid && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
      // Scroll to top on step change
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
    setIsPending(true)

    try {
      console.log('Calling registerCandidate with data:', {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        primarySkill: data.primarySkill,
        termsAccepted: data.termsAccepted,
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
        termsAccepted: data.termsAccepted,
      })

      console.log('Registration result:', result)

      if (result.success) {
        toast.success('Registration Successful!', {
          description: 'Your candidate profile has been created.',
        })
        router.push('/dashboard')
      } else {
        toast.error('Registration Failed', {
          description: result.error || 'Please try again.',
        })
        setIsPending(false)
      }
    } catch (error) {
      console.error('Registration error:', error)
      toast.error('Registration Failed', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
      })
      setIsPending(false)
    }
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
          />
        )
      case 6:
        return (
          <ReviewStep
            formValues={formValues}
            sameAsPhone={sameAsPhone}
            control={control}
            errors={errors}
          />
        )
      default:
        return null
    }
  }

  const progressPercentage = (currentStep / STEPS.length) * 100

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HomepageNavbar />
      
      <main className="flex-1 pt-24 sm:pt-28 md:pt-32 pb-8 sm:pb-12">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          {/* Header */}
          <div className="mb-6 sm:mb-8 text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#16252d] mb-2">
              Candidate Registration
            </h1>
            <p className="text-sm sm:text-base text-[#757575]">
              Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].description}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6 sm:mb-8">
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-[#4644b8] transition-all duration-300 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs sm:text-sm text-[#757575]">
                {Math.round(progressPercentage)}% Complete
              </span>
              <span className="text-xs sm:text-sm text-[#757575]">
                Step {currentStep}/{STEPS.length}
              </span>
            </div>
          </div>

          {/* Stepper - Desktop */}
          <div className="hidden md:block mb-8">
            <div className="relative">
              {/* Connecting lines - positioned at circle center */}
              <div className="absolute top-5 left-0 right-0 flex items-center pointer-events-none" style={{ height: '0' }}>
                {STEPS.slice(0, -1).map((step, index) => {
                  const stepWidth = 100 / STEPS.length
                  const lineStart = (index + 1) * stepWidth - stepWidth / 2
                  const lineEnd = (index + 2) * stepWidth - stepWidth / 2
                  const lineWidth = lineEnd - lineStart
                  
                  return (
                    <div
                      key={`line-${step.id}`}
                      className="absolute h-0.5"
                      style={{
                        left: `${lineStart}%`,
                        width: `${lineWidth}%`,
                        transform: 'translateY(-50%)',
                      }}
                    >
                      <div
                        className={cn(
                          "h-full w-full transition-colors duration-300",
                          currentStep > step.id ? 'bg-[#4644b8]' : 'bg-gray-200'
                        )}
                      />
                    </div>
                  )
                })}
              </div>
              
              {/* Step circles and labels */}
              <div className="flex justify-between relative z-10">
                {STEPS.map((step) => (
                  <div key={step.id} className="flex flex-col items-center flex-1 min-w-0">
                    {/* Circle - Fixed position */}
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 flex-shrink-0",
                        currentStep > step.id
                          ? 'bg-[#4644b8] border-[#4644b8] text-white shadow-md'
                          : currentStep === step.id
                          ? 'border-[#4644b8] bg-[#4644b8] text-white shadow-lg scale-110'
                          : 'border-gray-300 bg-white text-gray-400'
                      )}
                    >
                      {currentStep > step.id ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <span className="text-sm font-semibold">{step.id}</span>
                      )}
                    </div>
                    {/* Title - Below circle, handles wrapping */}
                    <div className="mt-2 text-center w-full min-h-[2.5rem] flex items-start justify-center px-1">
                      <p
                        className={cn(
                          "text-xs font-medium leading-tight break-words",
                          currentStep >= step.id ? 'text-[#16252d]' : 'text-gray-400'
                        )}
                      >
                        {step.stepperTitle}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stepper - Mobile */}
          <div className="md:hidden mb-6">
            <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
              {STEPS.map((step, index) => (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all",
                        currentStep > step.id
                          ? 'bg-[#4644b8] border-[#4644b8] text-white'
                          : currentStep === step.id
                          ? 'border-[#4644b8] bg-[#4644b8] text-white shadow-md scale-110'
                          : 'border-gray-300 bg-white text-gray-400'
                      )}
                    >
                      {currentStep > step.id ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <span className="text-xs font-semibold">{step.id}</span>
                      )}
                    </div>
                    <p
                      className={cn(
                        "text-[10px] font-medium mt-1 leading-tight text-center",
                        currentStep >= step.id ? 'text-[#16252d]' : 'text-gray-400'
                      )}
                    >
                      {step.shortTitle}
                    </p>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={cn(
                        "h-0.5 w-8 transition-colors",
                        currentStep > step.id ? 'bg-[#4644b8]' : 'bg-gray-200'
                      )}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Form Card */}
          <form onSubmit={handleSubmit(onSubmit, handleFormError)}>
            <Card className="shadow-lg border-0">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl sm:text-2xl text-[#16252d]">
                      {STEPS[currentStep - 1].title}
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base mt-1">
                      {STEPS[currentStep - 1].description}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="hidden sm:flex">
                    Step {currentStep}/{STEPS.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                {renderStep()}
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {currentStep < STEPS.length ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="w-full sm:w-auto bg-[#4644b8] hover:bg-[#3a3aa0] order-1 sm:order-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isPending}
                  size="lg"
                  className="w-full sm:w-auto bg-[#4644b8] hover:bg-[#3a3aa0] disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
                  onClick={async () => {
                    console.log('Complete Registration button clicked')
                    console.log('Form errors:', errors)
                    console.log('Form values:', formValues)
                    console.log('Is pending:', isPending)
                    
                    // Validate all fields before submission
                    const isValid = await trigger()
                    console.log('Form validation result:', isValid)
                    
                    if (!isValid) {
                      console.log('Form validation failed, errors:', errors)
                      // Show first error
                      const firstError = Object.values(errors)[0] as any
                      if (firstError?.message) {
                        toast.error('Validation Error', {
                          description: firstError.message,
                        })
                      }
                    }
                  }}
                >
                  {isPending ? 'Registering...' : 'Complete Registration'}
                </Button>
              )}
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}
