'use client'

import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field'
import { SubmitButton } from '@/components/auth/submit-button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { User, Building2 } from 'lucide-react'

import Link from 'next/link'

import { loginUser } from '@/lib/auth'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import type { LoginResponse } from '@/lib/auth'

interface LoginFormProps {
  collection?: string // Optional collection prop (e.g., 'candidates' for Candidate Portal)
}

export const LoginForm = ({ collection }: LoginFormProps = {}) => {
  const [isPending, setIsPending] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Determine initial user type from props or URL
  const initialCollection = collection || searchParams.get('collection')
  const getInitialUserType = (): 'candidate' | 'employer' => {
    if (initialCollection === 'employers') return 'employer'
    if (initialCollection === 'candidates') return 'candidate'
    return 'candidate' // Default to candidate
  }

  const [userType, setUserType] = useState<'candidate' | 'employer'>(getInitialUserType())

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsPending(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    // Determine which collection to use based on selected user type
    const targetCollection =
      collection || searchParams.get('collection') || (userType === 'employer' ? 'employers' : 'candidates')

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
          toast.error('Invalid Email', {
            description: res.error,
          })
          break
        case 'INVALID_CREDENTIALS':
          toast.error('Invalid Credentials', {
            description: 'The email or password you entered is incorrect',
          })
          break
        case 'AUTH_ERROR':
          toast.error('Authentication Failed', {
            description: 'Please try again later',
          })
          break
        default:
          toast.error('Login Failed', {
            description: res.error || 'Something went wrong',
          })
      }
    } else {
      toast.success('Welcome back!', {
        description: 'Redirecting to dashboard...',
      })
      
      // Redirect based on user type and collection
      if (successfulCollection === 'employers') {
        router.push('/candidates')
      } else if (successfulCollection === 'candidates') {
        router.push('/dashboard')
      } else {
        // Fallback to general dashboard
        router.push('/dashboard')
      }
    }
  }

  return (
    <div className="my-6">
      {/* User Type Selector */}
      <Tabs
        value={userType}
        onValueChange={(value) => setUserType(value as 'candidate' | 'employer')}
        className="mb-6"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="candidate" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>Candidate</span>
          </TabsTrigger>
          <TabsTrigger value="employer" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span>Employer</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Login Form */}
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              name="email"
              placeholder="email@example.com"
              autoComplete="email"
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              name="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
            <FieldDescription>
              <Link href="/forgot-password" className="hover:underline">
                Forgot password?
              </Link>
            </FieldDescription>
          </Field>

          <Field orientation="horizontal">
            <Checkbox
              id="remember-me"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked === true)}
            />
            <FieldLabel htmlFor="remember-me">Remember me for 30 days</FieldLabel>
          </Field>

          <SubmitButton loading={isPending} text={`Login as ${userType === 'employer' ? 'Employer' : 'Candidate'}`} />
        </FieldGroup>
      </form>
    </div>
  )
}
