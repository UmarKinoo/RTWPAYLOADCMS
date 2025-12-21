'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'

import { Field, FieldGroup, FieldLabel, FieldError, FieldDescription } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { SkillSearch } from '@/components/candidate/SkillSearch'
import { registerCandidate } from '@/lib/candidate'
import { validatePassword, validateEmail } from '@/lib/validation'

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

type CandidateFormData = z.infer<typeof candidateSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [sameAsPhone, setSameAsPhone] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<CandidateFormData>({
    resolver: zodResolver(candidateSchema),
    defaultValues: {
      sameAsPhone: false,
      termsAccepted: false,
    },
  })

  const phone = watch('phone')
  const primarySkill = watch('primarySkill')

  // Update WhatsApp when "same as phone" is checked
  React.useEffect(() => {
    if (sameAsPhone && phone) {
      setValue('whatsapp', phone)
    }
  }, [sameAsPhone, phone, setValue])

  const onSubmit = async (data: CandidateFormData) => {
    setIsPending(true)

    try {
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

      if (result.success) {
        toast.success('Registration Successful!', {
          description: 'Your candidate profile has been created.',
        })
        router.push('/dashboard')
      } else {
        toast.error('Registration Failed', {
          description: result.error || 'Please try again.',
        })
      }
    } catch (error) {
      toast.error('Registration Failed', {
        description: 'An unexpected error occurred. Please try again.',
      })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Candidate Registration</h1>
        <p className="text-muted-foreground">Please fill in all required fields (*)</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <Field data-invalid={!!errors.firstName}>
              <FieldLabel htmlFor="firstName">First Name *</FieldLabel>
              <Input
                id="firstName"
                {...register('firstName')}
                placeholder="Enter your First Name"
              />
              {errors.firstName && <FieldError>{errors.firstName.message}</FieldError>}
            </Field>

            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="email">Email *</FieldLabel>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="Enter your Email Address"
              />
              {errors.email && <FieldError>{errors.email.message}</FieldError>}
            </Field>

            <Field data-invalid={!!errors.password}>
              <FieldLabel htmlFor="password">Password *</FieldLabel>
              <Input
                id="password"
                type="password"
                {...register('password')}
                placeholder="Enter your Password"
              />
              {errors.password && <FieldError>{errors.password.message}</FieldError>}
            </Field>

            <Field data-invalid={!!errors.confirmPassword}>
              <FieldLabel htmlFor="confirmPassword">Confirm Password *</FieldLabel>
              <Input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword')}
                placeholder="Confirm your Password"
              />
              {errors.confirmPassword && <FieldError>{errors.confirmPassword.message}</FieldError>}
            </Field>

            <Field data-invalid={!!errors.phone}>
              <FieldLabel htmlFor="phone">Phone Number *</FieldLabel>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="Enter phone number"
              />
              {errors.phone && <FieldError>{errors.phone.message}</FieldError>}
            </Field>

            <Field data-invalid={!!errors.languages}>
              <FieldLabel htmlFor="languages">Language *</FieldLabel>
              <Input
                id="languages"
                {...register('languages')}
                placeholder="Language Speaking/Reading and Writing"
              />
              {errors.languages && <FieldError>{errors.languages.message}</FieldError>}
            </Field>

            <Field data-invalid={!!errors.nationality}>
              <FieldLabel htmlFor="nationality">Nationality *</FieldLabel>
              <Input
                id="nationality"
                {...register('nationality')}
                placeholder="Select Nationality"
              />
              {errors.nationality && <FieldError>{errors.nationality.message}</FieldError>}
            </Field>

            <Field data-invalid={!!errors.location}>
              <FieldLabel htmlFor="location">Location *</FieldLabel>
              <Input
                id="location"
                {...register('location')}
                placeholder="Select Location"
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
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <Field data-invalid={!!errors.lastName}>
              <FieldLabel htmlFor="lastName">Last Name *</FieldLabel>
              <Input
                id="lastName"
                {...register('lastName')}
                placeholder="Enter your Last Name"
              />
              {errors.lastName && <FieldError>{errors.lastName.message}</FieldError>}
            </Field>

            <Field data-invalid={!!errors.whatsapp}>
              <FieldLabel htmlFor="whatsapp">WhatsApp *</FieldLabel>
              <div className="space-y-2">
                <Input
                  id="whatsapp"
                  {...register('whatsapp')}
                  placeholder="Enter WhatsApp Number if different"
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
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Same as Phone
                  </label>
                </div>
              </div>
              {errors.whatsapp && <FieldError>{errors.whatsapp.message}</FieldError>}
            </Field>

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
                placeholder="Enter Date of Birth"
              />
              {errors.dob && <FieldError>{errors.dob.message}</FieldError>}
            </Field>

            <Field data-invalid={!!errors.jobTitle}>
              <FieldLabel htmlFor="jobTitle">Job Title *</FieldLabel>
              <Input
                id="jobTitle"
                {...register('jobTitle')}
                placeholder="Select Job Title"
              />
              {errors.jobTitle && <FieldError>{errors.jobTitle.message}</FieldError>}
            </Field>

            <Field data-invalid={!!errors.experienceYears}>
              <FieldLabel htmlFor="experienceYears">Experience *</FieldLabel>
              <Input
                id="experienceYears"
                type="number"
                {...register('experienceYears', { valueAsNumber: true })}
                placeholder="Enter years of Experience"
                min={0}
              />
              {errors.experienceYears && <FieldError>{errors.experienceYears.message}</FieldError>}
            </Field>

            <Field data-invalid={!!errors.saudiExperience}>
              <FieldLabel htmlFor="saudiExperience">Experience in Saudi *</FieldLabel>
              <Input
                id="saudiExperience"
                type="number"
                {...register('saudiExperience', { valueAsNumber: true })}
                placeholder="Enter years of Experience in Saudi Arabia"
                min={0}
              />
              {errors.saudiExperience && (
                <FieldError>{errors.saudiExperience.message}</FieldError>
              )}
            </Field>

            <Field data-invalid={!!errors.availabilityDate}>
              <FieldLabel htmlFor="availabilityDate">Date Availability to join *</FieldLabel>
              <Input
                id="availabilityDate"
                type="date"
                {...register('availabilityDate')}
                placeholder="Now"
              />
              {errors.availabilityDate && (
                <FieldError>{errors.availabilityDate.message}</FieldError>
              )}
            </Field>

            <Field data-invalid={!!errors.currentEmployer}>
              <FieldLabel htmlFor="currentEmployer">Name of Current Employer</FieldLabel>
              <Input
                id="currentEmployer"
                {...register('currentEmployer')}
                placeholder="BMW"
              />
              {errors.currentEmployer && <FieldError>{errors.currentEmployer.message}</FieldError>}
            </Field>

            <Field data-invalid={!!errors.visaExpiry}>
              <FieldLabel htmlFor="visaExpiry">Visa Expiry date</FieldLabel>
              <Input
                id="visaExpiry"
                type="date"
                {...register('visaExpiry')}
                placeholder="Enter Visa Expiry date"
              />
              {errors.visaExpiry && <FieldError>{errors.visaExpiry.message}</FieldError>}
            </Field>

            <Field data-invalid={!!errors.visaProfession}>
              <FieldLabel htmlFor="visaProfession">Job Position in Visa</FieldLabel>
              <Input
                id="visaProfession"
                {...register('visaProfession')}
                placeholder="Enter Job Position in Visa"
              />
              {errors.visaProfession && <FieldError>{errors.visaProfession.message}</FieldError>}
            </Field>
          </div>
        </div>

        {/* Smart Search - Full Width */}
        <div className="col-span-2">
          <SkillSearch
            value={primarySkill}
            onValueChange={(skillId) => setValue('primarySkill', skillId)}
            error={errors.primarySkill?.message}
          />
        </div>

        {/* Terms Acceptance */}
        <Field data-invalid={!!errors.termsAccepted}>
          <Controller
            name="termsAccepted"
            control={control}
            render={({ field }) => (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="termsAccepted"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
                <label
                  htmlFor="termsAccepted"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  onClick={() => field.onChange(!field.value)}
                >
                  Accept the terms and conditions / Agreement Accepted (Y-N) *
                </label>
              </div>
            )}
          />
          {errors.termsAccepted && <FieldError>{errors.termsAccepted.message}</FieldError>}
        </Field>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending} size="lg">
            {isPending ? 'Registering...' : 'Register'}
          </Button>
        </div>
      </form>
    </div>
  )
}

