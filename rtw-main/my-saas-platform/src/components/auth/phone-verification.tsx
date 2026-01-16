'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field'
import { toast } from 'sonner'

interface PhoneVerificationProps {
  phone?: string
  userId?: string
  userCollection?: 'candidates' | 'employers' // Users collection not supported
  onVerified?: () => void
}

export function PhoneVerification({
  phone: initialPhone,
  userId,
  userCollection,
  onVerified,
}: PhoneVerificationProps) {
  const [phone, setPhone] = useState(initialPhone || '')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'phone' | 'verify'>(initialPhone ? 'verify' : 'phone')
  const [isLoading, setIsLoading] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)
  const [otpSent, setOtpSent] = useState(false)
  const [devOtp, setDevOtp] = useState<string | null>(null) // For testing in dev mode

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCountdown])

  // Auto-send OTP when component mounts with phone number (for registration flow)
  useEffect(() => {
    if (initialPhone && step === 'verify' && !otpSent) {
      // Auto-send OTP when phone is provided and we're in verify step
      const sendInitialOTP = async () => {
        setIsLoading(true)
        try {
          const response = await fetch('/api/otp/start', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              phone: initialPhone,
              userId,
              userCollection,
            }),
          })

          const data = await response.json()
          console.log('[PhoneVerification] Full API response (auto-send):', JSON.stringify(data, null, 2))

          if (data.ok) {
            toast.success('Verification code sent!')
            setResendCountdown(60)
            setOtpSent(true)
            // Store OTP for testing in dev mode
            if (data.otp) {
              console.log('[PhoneVerification] Dev OTP received (auto-send):', data.otp)
              setDevOtp(String(data.otp))
            } else {
              console.log('[PhoneVerification] No OTP in response (auto-send). Response keys:', Object.keys(data))
            }
          } else {
            toast.error(data.error || 'Failed to send verification code')
            setStep('phone') // Fallback to phone input if send fails
          }
        } catch (error) {
          toast.error('An error occurred. Please try again.')
          setStep('phone')
        } finally {
          setIsLoading(false)
        }
      }

      sendInitialOTP()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount

  const handleSendCode = async () => {
    if (!phone.trim()) {
      toast.error('Phone number is required')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/otp/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          userId,
          userCollection,
        }),
      })

      const data = await response.json()
      console.log('[PhoneVerification] Full API response:', JSON.stringify(data, null, 2))

      if (data.ok) {
        toast.success('Verification code sent!')
        setStep('verify')
        setResendCountdown(60) // 60 second countdown
        setOtpSent(true)
        // Store OTP for testing in dev mode
        if (data.otp) {
          console.log('[PhoneVerification] Dev OTP received:', data.otp)
          setDevOtp(String(data.otp))
        } else {
          console.log('[PhoneVerification] No OTP in response. Response keys:', Object.keys(data))
        }
      } else {
        toast.error(data.error || 'Failed to send verification code')
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!code.trim() || code.length !== 6) {
      toast.error('Please enter a valid 6-digit code')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          code,
        }),
      })

      const data = await response.json()

      if (data.ok && data.verified) {
        toast.success('Phone number verified successfully!')
        onVerified?.()
      } else {
        toast.error(data.error || 'Invalid verification code')
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (resendCountdown > 0) {
      return
    }
    await handleSendCode()
  }

  if (step === 'phone') {
    return (
      <div className="space-y-4">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
            <Input
              id="phone"
              type="tel"
              placeholder="+9665xxxxxxx or 5xxxxxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isLoading}
            />
            <FieldDescription>
              Enter your phone number to receive a verification code
            </FieldDescription>
          </Field>
        </FieldGroup>
        <Button onClick={handleSendCode} disabled={isLoading} className="w-full">
          {isLoading ? 'Sending...' : 'Send Verification Code'}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="code">Verification Code</FieldLabel>
          <Input
            id="code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '')
              setCode(value)
            }}
            disabled={isLoading}
            className="text-center text-2xl tracking-widest"
          />
          <FieldDescription>
            Enter the 6-digit code sent to {phone}. Code expires in 3 minutes.
          </FieldDescription>
          {/* Dev mode: Show OTP for testing */}
          {devOtp && (
            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-xs font-semibold text-yellow-800 mb-1">
                🧪 DEV MODE - OTP Code (for testing only):
              </p>
              <p className="text-lg font-mono font-bold text-yellow-900 text-center">
                {devOtp}
              </p>
            </div>
          )}
        </Field>
      </FieldGroup>
      <Button onClick={handleVerifyCode} disabled={isLoading || code.length !== 6} className="w-full">
        {isLoading ? 'Verifying...' : 'Verify Code'}
      </Button>
      <div className="text-center text-sm text-muted-foreground">
        {resendCountdown > 0 ? (
          <span>Resend code in {resendCountdown}s</span>
        ) : (
          <button
            type="button"
            onClick={handleResendCode}
            className="text-primary hover:underline"
            disabled={isLoading}
          >
            Resend code
          </button>
        )}
      </div>
      <Button
        variant="outline"
        onClick={() => {
          setStep('phone')
          setCode('')
          setResendCountdown(0)
        }}
        disabled={isLoading}
        className="w-full"
      >
        Change Phone Number
      </Button>
    </div>
  )
}

