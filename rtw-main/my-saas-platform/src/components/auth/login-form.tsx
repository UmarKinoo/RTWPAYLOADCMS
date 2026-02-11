'use client'

import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field'
import { SubmitButton } from '@/components/auth/submit-button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
// import { signIn } from 'next-auth/react' // Temporarily commented out - Google login disabled

import { Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'

import { loginUser } from '@/lib/auth'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import type { LoginResponse } from '@/lib/auth'

interface LoginFormProps {
  collection?: string // Optional collection prop (e.g., 'candidates' for Candidate Portal)
}

export const LoginForm = ({ collection }: LoginFormProps = {}) => {
  const t = useTranslations('auth')
  const tButtons = useTranslations('buttons')
  const tErrors = useTranslations('errors')
  const [isPending, setIsPending] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const locale = pathname.split('/')[1] || 'en'

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsPending(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    // Determine which collection to use - try candidates first, then employers, then users
    const targetCollection = collection || searchParams.get('collection') || 'candidates'

    let res: LoginResponse

    // Try the selected collection first
    let successfulCollection = targetCollection
    res = await loginUser({ email, password, rememberMe, collection: targetCollection })

    // If login fails, try the other collections as fallback
    if (!res.success && res.errorCode === 'INVALID_CREDENTIALS') {
      if (targetCollection === 'candidates') {
        // Try employers, then users
        res = await loginUser({ email, password, rememberMe, collection: 'employers' })
        if (res.success) {
          successfulCollection = 'employers'
        } else if (res.errorCode === 'INVALID_CREDENTIALS') {
          res = await loginUser({ email, password, rememberMe, collection: 'users' })
          if (res.success) {
            successfulCollection = 'users'
          }
        }
      } else if (targetCollection === 'employers') {
        // Try candidates, then users
        res = await loginUser({ email, password, rememberMe, collection: 'candidates' })
        if (res.success) {
          successfulCollection = 'candidates'
        } else if (res.errorCode === 'INVALID_CREDENTIALS') {
          res = await loginUser({ email, password, rememberMe, collection: 'users' })
          if (res.success) {
            successfulCollection = 'users'
          }
        }
      }
    }

    setIsPending(false)

    if (res.error) {
      // Show error toast with specific error message
      switch (res.errorCode) {
        case 'INVALID_EMAIL':
          toast.error(t('invalidEmail'), {
            description: res.error,
          })
          break
        case 'INVALID_CREDENTIALS':
          toast.error(t('invalidCredentials'), {
            description: t('emailOrPasswordIncorrect'),
          })
          break
        case 'AUTH_ERROR':
          toast.error(t('authenticationFailed'), {
            description: t('pleaseTryAgainLater'),
          })
          break
        default:
          toast.error(t('loginFailed'), {
            description: res.error || t('somethingWentWrong'),
          })
      }
    } else {
      toast.success(t('welcomeBack'), {
        description: t('redirectingToDashboard'),
      })
      
      // Redirect based on user type and collection
      if (successfulCollection === 'employers') {
        router.push(`/${locale}/candidates`)
      } else if (successfulCollection === 'candidates') {
        router.push(`/${locale}/dashboard`)
      } else if (successfulCollection === 'users') {
        // Staff (admin, blog-editor, moderator) → Payload admin
        router.push('/admin')
      } else {
        router.push(`/${locale}/dashboard`)
      }
    }
  }

  return (
    <div className="w-full">
      {/* Login Form */}
      <form onSubmit={handleSubmit} className="w-full">
        <FieldGroup className="space-y-3">
          <Field>
            <FieldLabel htmlFor="email" className="text-xs font-medium text-[#16252d] mb-1">
              {t('email')}
            </FieldLabel>
            <Input
              id="email"
              type="email"
              name="email"
              placeholder="email@example.com"
              autoComplete="email"
              required
              className="h-9 text-sm"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="password" className="text-xs font-medium text-[#16252d] mb-1">
              {t('password')}
            </FieldLabel>
            <Input
              id="password"
              type="password"
              name="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              className="h-9 text-sm"
            />
            <FieldDescription className="mt-1">
              <Link href="/forgot-password" className="text-xs text-[#4644b8] hover:text-[#3a3aa0] hover:underline transition-colors">
                {t('forgotPassword')}
              </Link>
            </FieldDescription>
          </Field>

          <Field orientation="horizontal" className="items-center">
            <Checkbox
              id="remember-me"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked === true)}
            />
            <FieldLabel htmlFor="remember-me" className="text-xs text-[#16252d] font-normal cursor-pointer">
              {t('rememberMe')}
            </FieldLabel>
          </Field>

          <SubmitButton
            loading={isPending}
            text={t('login')}
            className="w-full h-9 text-sm font-semibold"
          />
        </FieldGroup>
      </form>

      {/* Social Login Section - Google login temporarily commented out */}
      {/* <div className="mt-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-white px-2 text-gray-400 font-medium">
              Or continue with
            </span>
          </div>
        </div>

        <div className="mt-3">
          <Button
            type="button"
            variant="outline"
            className="w-full h-9 text-sm border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors"
            onClick={() => {
              const callbackUrl = `/${locale}/auth/social/callback`
              signIn('google', {
                callbackUrl,
              })
            }}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>
        </div>
      </div> */}
    </div>
  )
}
