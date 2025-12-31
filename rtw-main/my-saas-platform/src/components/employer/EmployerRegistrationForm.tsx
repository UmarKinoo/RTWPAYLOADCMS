'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import Image from 'next/image'
import { registerEmployer } from '@/lib/employer'

// Google logo
const googleLogo = '/assets/8f7935e769322ac3c425296f0ab80d00c06649f5.png'

interface FloatingLabelInputProps {
  label: string
  required?: boolean
  type?: string
  placeholder: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  name: string
  showPasswordToggle?: boolean
}

const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({
  label,
  required = false,
  type = 'text',
  placeholder,
  value,
  onChange,
  name,
  showPasswordToggle = false,
}) => {
  const [showPassword, setShowPassword] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  return (
    <div className="relative w-full">
      {/* Floating Label */}
      <label
        className={cn(
          "absolute left-3 -top-2 bg-white px-2 py-0.5 rounded-full text-sm font-medium text-[#16252d] transition-all z-10",
          (isFocused || value) ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        {label}
        {required && <span className="text-[#dc0000] ml-0.5">*</span>}
      </label>

      {/* Input */}
      <div className="relative">
        <Input
          type={showPasswordToggle && !showPassword ? 'password' : type}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            "h-14 w-full border border-[#a5a5a5] rounded-lg px-4",
            "text-sm text-[#757575] placeholder:text-[#757575]",
            "focus-visible:border-[#4644b8] focus-visible:ring-[#4644b8]/20 focus-visible:ring-2",
            "transition-all"
          )}
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a5a5a5] hover:text-[#757575] transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
    </div>
  )
}

export const EmployerRegistrationForm: React.FC = () => {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [formData, setFormData] = useState({
    responsiblePerson: '',
    companyName: '',
    email: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPending(true)

    try {
      // Client-side validation
      if (!formData.responsiblePerson.trim()) {
        toast.error('Validation Error', {
          description: 'Please enter the responsible person name',
        })
        setIsPending(false)
        return
      }

      if (!formData.companyName.trim()) {
        toast.error('Validation Error', {
          description: 'Please enter your company name',
        })
        setIsPending(false)
        return
      }

      if (!formData.email.trim()) {
        toast.error('Validation Error', {
          description: 'Please enter your email address',
        })
        setIsPending(false)
        return
      }

      if (!formData.password || formData.password.length < 8) {
        toast.error('Validation Error', {
          description: 'Password must be at least 8 characters long',
        })
        setIsPending(false)
        return
      }

      if (formData.password !== formData.confirmPassword) {
        toast.error('Validation Error', {
          description: 'Passwords do not match',
        })
        setIsPending(false)
        return
      }

      if (!formData.termsAccepted) {
        toast.error('Validation Error', {
          description: 'You must accept the terms and conditions',
        })
        setIsPending(false)
        return
      }

      // Call server action
      const result = await registerEmployer({
        responsiblePerson: formData.responsiblePerson,
        companyName: formData.companyName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        termsAccepted: formData.termsAccepted,
      })

      if (result.success) {
        toast.success('Registration Successful!', {
          description: 'Your employer account has been created successfully.',
        })
        // Redirect to candidates page
        router.push('/candidates')
      } else {
        toast.error('Registration Failed', {
          description: result.error || 'Please try again.',
        })
      }
    } catch (error) {
      console.error('Registration error:', error)
      toast.error('Registration Failed', {
        description: 'An unexpected error occurred. Please try again.',
      })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="flex gap-2 mb-6 sm:mb-8">
        <div className="h-2.5 flex-1 bg-[#4644b8] rounded-lg transition-all" />
        <div className="h-2.5 flex-1 bg-[#afb7ff] rounded-lg transition-all" />
      </div>

      {/* Title and Description */}
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[#16252d] mb-3 sm:mb-4 leading-tight">
          Register your company and join our club.
        </h2>
        <p className="text-sm sm:text-base text-[#a5a5a5] leading-relaxed px-2">
          Please enter your personal details to set up your account and personalize your experience
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {/* Responsible Person */}
        <FloatingLabelInput
          label="Responsible Person"
          required
          placeholder="Enter your Full Name"
          value={formData.responsiblePerson}
          onChange={handleInputChange}
          name="responsiblePerson"
        />

        {/* Company Name */}
        <FloatingLabelInput
          label="Company Name"
          required
          placeholder="Enter your role"
          value={formData.companyName}
          onChange={handleInputChange}
          name="companyName"
        />

        {/* Email */}
        <FloatingLabelInput
          label="Email"
          required
          type="email"
          placeholder="Enter your Bussiness Email"
          value={formData.email}
          onChange={handleInputChange}
          name="email"
        />

        {/* Password */}
        <FloatingLabelInput
          label="Password"
          required
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleInputChange}
          name="password"
          showPasswordToggle
        />

        {/* Confirm Password */}
        <FloatingLabelInput
          label="Confirm Password"
          required
          placeholder="Confirm your Password"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          name="confirmPassword"
          showPasswordToggle
        />

        {/* Terms and Conditions Checkbox */}
        <div className="flex items-start gap-3 pt-2">
          <Checkbox
            id="terms"
            checked={formData.termsAccepted}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({ ...prev, termsAccepted: checked === true }))
            }
            className="mt-1"
          />
          <label
            htmlFor="terms"
            className="text-xs sm:text-sm text-[#757575] leading-relaxed cursor-pointer"
          >
            I agree to Ready To Work's{' '}
            <Link href="/privacy-policy" className="underline hover:text-[#4644b8] transition-colors">
              Terms and Conditions and Privacy Policy
            </Link>
            . All my data is protected with our{' '}
            <Link href="/privacy-policy" className="underline hover:text-[#4644b8] transition-colors">
              Privacy Policy
            </Link>
            .
          </label>
        </div>

        {/* Sign Up Button */}
        <Button
          type="submit"
          disabled={isPending}
          className="w-full h-12 sm:h-14 bg-[#4644b8] hover:bg-[#3a3aa0] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm sm:text-base font-medium mt-6"
        >
          {isPending ? 'Signing up...' : 'Sign up'}
        </Button>

        {/* OR Divider */}
        <div className="flex items-center gap-3 sm:gap-4 my-6 sm:my-8">
          <Separator className="flex-1" />
          <span className="text-xs sm:text-sm text-[#a5a5a5] font-medium">OR</span>
          <Separator className="flex-1" />
        </div>

        {/* Google Sign Up Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full h-12 sm:h-14 border border-[#16252d] rounded-lg text-sm sm:text-base font-medium flex items-center justify-center gap-2 hover:bg-gray-50"
        >
          <div className="relative w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0">
            <Image
              src={googleLogo}
              alt="Google"
              fill
              className="object-contain"
            />
          </div>
          <span className="whitespace-nowrap">Sign up with Google</span>
        </Button>

        {/* Login Link */}
        <div className="text-center text-xs sm:text-sm pt-2">
          <span className="text-[#757575]">Do you already have an account? </span>
          <Link href="/login" className="font-semibold text-[#4644b8] hover:underline transition-colors">
            Login
          </Link>
        </div>
      </form>

    </div>
  )
}
