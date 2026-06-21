'use client'

import { CheckCircle2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface LoginVerificationBannerProps {
  success?: string
  error?: string
}

export function LoginVerificationBanner({ success, error }: LoginVerificationBannerProps) {
  if (success === 'email-verified') {
    return (
      <Alert className="mb-4 border-green-200 bg-green-50 text-green-950">
        <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden />
        <AlertTitle>Email verified successfully</AlertTitle>
        <AlertDescription>
          Your email address has been confirmed. You can now sign in to your account.
        </AlertDescription>
      </Alert>
    )
  }

  const verificationErrors = new Set([
    'invalid-verification-link',
    'verification-link-expired',
    'verification-failed',
  ])

  if (!error || !verificationErrors.has(error)) return null

  const messages: Record<string, { title: string; description: string }> = {
    'invalid-verification-link': {
      title: 'Invalid verification link',
      description: 'The verification link is invalid. Please request a new one.',
    },
    'verification-link-expired': {
      title: 'Verification link expired',
      description: 'This link has expired. Please request a new verification email.',
    },
    'verification-failed': {
      title: 'Verification failed',
      description: 'We could not verify your email. Please try again or contact support.',
    },
  }

  const message = messages[error] ?? {
    title: 'Something went wrong',
    description: 'An error occurred. Please try again.',
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" aria-hidden />
      <AlertTitle>{message.title}</AlertTitle>
      <AlertDescription>{message.description}</AlertDescription>
    </Alert>
  )
}
