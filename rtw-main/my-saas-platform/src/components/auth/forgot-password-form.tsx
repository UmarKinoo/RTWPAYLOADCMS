'use client'

import { useState } from 'react'
import Link from 'next/link'
import { forgotPassword } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('[FORGOT_PASSWORD_FORM] Form submitted with email:', email)
    setIsLoading(true)

    const startTime = Date.now()
    try {
      console.log('[FORGOT_PASSWORD_FORM] Starting forgot password request...')
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 30000)
      )
      
      const result = await Promise.race([
        forgotPassword(email),
        timeoutPromise,
      ]) as Awaited<ReturnType<typeof forgotPassword>>

      const duration = Date.now() - startTime
      console.log('[FORGOT_PASSWORD_FORM] Request completed in', duration, 'ms')
      console.log('[FORGOT_PASSWORD_FORM] Result:', { success: result.success, errorCode: result.errorCode })

      if (result.success) {
        console.log('[FORGOT_PASSWORD_FORM] ✅ Success - showing success message')
        setIsSuccess(true)
        toast.success('Email Sent!', {
          description:
            "If an account with that email exists, we've sent you a password reset link.",
        })
      } else {
        console.log('[FORGOT_PASSWORD_FORM] ❌ Failed with error code:', result.errorCode)
        switch (result.errorCode) {
          case 'INVALID_EMAIL':
            toast.error('Invalid Email', {
              description: result.error || 'Please enter a valid email address',
            })
            break
          default:
            toast.error('Request Failed', {
              description: result.error || 'Something went wrong. Please try again.',
            })
        }
      }
    } catch (error) {
      const duration = Date.now() - startTime
      console.error('[FORGOT_PASSWORD_FORM] ❌ Error caught after', duration, 'ms:', error)
      console.error('[FORGOT_PASSWORD_FORM] Error type:', error instanceof Error ? error.constructor.name : typeof error)
      console.error('[FORGOT_PASSWORD_FORM] Error message:', error instanceof Error ? error.message : String(error))
      if (error instanceof Error && error.stack) {
        console.error('[FORGOT_PASSWORD_FORM] Error stack:', error.stack)
      }
      
      toast.error('Request Failed', {
        description: error instanceof Error && error.message === 'Request timeout'
          ? 'The request took too long. Please try again.'
          : 'Something went wrong. Please try again.',
      })
    } finally {
      console.log('[FORGOT_PASSWORD_FORM] Setting loading to false')
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="space-y-4 text-center my-6">
        <p className="text-muted-foreground">Check your email for the password reset link.</p>
        <Link href="/login" className="text-foreground hover:underline">
          Return to login
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="my-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <FieldDescription>
            Enter your email address and we&apos;ll send you a password reset link.
          </FieldDescription>
        </Field>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send Reset Link'}
        </Button>
      </FieldGroup>
    </form>
  )
}
