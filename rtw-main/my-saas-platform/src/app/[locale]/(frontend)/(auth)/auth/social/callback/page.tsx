/**
 * Social Login Callback Page
 * 
 * Handles the OAuth callback flow:
 * 1. Receives OAuth success
 * 2. Generates short-lived token with userId
 * 3. Calls Pattern A endpoint to create Payload session
 * 4. Redirects based on user onboarding status
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

export default function SocialCallbackPage() {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [isProcessing, setIsProcessing] = useState(true)
  const locale = pathname.split('/')[1] || 'en'

  useEffect(() => {
    async function handleCallback() {
      if (status === 'loading') {
        return // Wait for session to load
      }

      if (status === 'unauthenticated') {
        // OAuth failed or was cancelled
        toast.error('Authentication failed', {
          description: 'Please try again or use email/password login.',
        })
        router.push(`/${locale}/login`)
        return
      }

      if (!session?.user?.email || !session.user.id) {
        console.error('Social callback: Missing user data in session')
        toast.error('Authentication error', {
          description: 'Missing user information. Please try again.',
        })
        router.push(`/${locale}/login`)
        return
      }

      try {
        // Generate short-lived token via server endpoint (PAYLOAD_SECRET must be server-side only)
        const response = await fetch('/api/auth/generate-social-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: session.user.id,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to generate token')
        }

        const { token } = await response.json()

        // Call Pattern A endpoint to create Payload session
        const socialLoginResponse = await fetch('/api/users/social-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Important: include cookies
          body: JSON.stringify({ token }),
        })

        if (!socialLoginResponse.ok) {
          const errorData = await socialLoginResponse.json()
          throw new Error(errorData.error || 'Failed to create session')
        }

        // Success! Check user onboarding status and redirect
        const userData = await socialLoginResponse.json()
        
        // Check if user needs onboarding
        // Since Users collection doesn't have onboardingComplete field,
        // we'll check if user has a candidate or employer profile
        const checkOnboardingResponse = await fetch('/api/users/me', {
          credentials: 'include',
        })

        if (checkOnboardingResponse.ok) {
          const user = await checkOnboardingResponse.json()
          
          // Check if user has candidate or employer profile
          // If not, redirect to onboarding
          // For now, redirect to dashboard - onboarding check can be added later
          router.push(`/${locale}/dashboard`)
        } else {
          router.push(`/${locale}/dashboard`)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error('Social callback error:', errorMessage)
        toast.error('Login failed', {
          description: errorMessage,
        })
        router.push(`/${locale}/login`)
      } finally {
        setIsProcessing(false)
      }
    }

    handleCallback()
  }, [status, session, router, locale])

  if (isProcessing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Completing login...</p>
        </div>
      </div>
    )
  }

  return null
}

