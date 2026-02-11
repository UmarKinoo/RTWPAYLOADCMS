'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Link, useRouter } from '@/i18n/routing'
import { acceptInvitation, getUser } from '@/lib/auth'
import { Section, Container } from '@/components/ds'
import { Button } from '@/components/ui/button'
import { AuthBox } from '@/components/auth/auth-box'
import { toast } from 'sonner'
import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

function AcceptInvitationForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [acceptedRole, setAcceptedRole] = useState<'admin' | 'blog-editor' | 'moderator' | 'user' | undefined>()
  const [token, setToken] = useState('')
  const [email, setEmail] = useState('')

  const searchParams = useSearchParams()
  const router = useRouter()
  const locale = useLocale()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getUser()
        if (user) {
          const role = (user as { role?: string }).role
          const isPayloadStaff = role === 'admin' || role === 'blog-editor'
          toast.info('Already Signed In', {
            description: isPayloadStaff ? 'Redirecting to admin...' : 'Redirecting...',
          })
          router.push(isPayloadStaff ? '/admin' : `/${locale}/login`)
        }
      } catch {
        // Not authenticated, continue
      }
    }
    checkAuth()
  }, [router, locale])

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    const emailParam = searchParams.get('email')
    if (tokenParam && emailParam) {
      setToken(tokenParam)
      setEmail(decodeURIComponent(emailParam))
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (password !== confirmPassword) {
      toast.error('Passwords do not match', {
        description: 'Please make sure both passwords are the same.',
      })
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      toast.error('Password too short', {
        description: 'Password must be at least 8 characters long.',
      })
      setIsLoading(false)
      return
    }

    try {
      const result = await acceptInvitation(token, email, password)

      if (result.success) {
        setIsSuccess(true)
        setAcceptedRole(result.role)
        toast.success('Password set successfully', {
          description: 'Redirecting you to sign in...',
        })
        const isPayloadStaff = result.role === 'admin' || result.role === 'blog-editor'
        const destination = isPayloadStaff ? '/admin' : `/${locale}/login`
        setTimeout(() => router.push(destination), 1200)
      } else {
        switch (result.errorCode) {
          case 'INVALID_OR_EXPIRED_TOKEN':
            toast.error('Invalid or expired link', {
              description: 'This invitation link has expired. Ask an admin to send a new one.',
            })
            break
          case 'INVALID_PASSWORD':
            toast.error('Invalid password', {
              description: result.error || 'Please enter a valid password',
            })
            break
          default:
            toast.error('Something went wrong', {
              description: result.error || 'Please try again.',
            })
        }
      }
    } catch {
      toast.error('Something went wrong', {
        description: 'Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!token || !email) {
    return (
      <Section>
        <Container>
          <AuthBox>
            <h1>Invalid invitation link</h1>
            <p className="text-muted-foreground mb-4">
              This link is invalid or incomplete. Check your email for the full invitation link.
            </p>
            <div className="text-center">
              <Link href="/login" className="text-foreground hover:underline">
                Back to sign in
              </Link>
            </div>
          </AuthBox>
        </Container>
      </Section>
    )
  }

  return (
    <Section>
      <Container>
        <AuthBox>
          <h1>Set your password</h1>
          <p className="text-muted-foreground mb-4">
            You&apos;ve been invited to Ready to Work. Choose a password to activate your account.
          </p>

          {isSuccess ? (
            <div className="space-y-4 text-center">
              <p className="text-muted-foreground">Your password has been set successfully.</p>
              <p className="text-muted-foreground text-sm">Redirecting you to sign in…</p>
              <Button asChild>
                {acceptedRole === 'admin' || acceptedRole === 'blog-editor' ? (
                  <Link href="/admin">Sign in to admin</Link>
                ) : (
                  <Link href="/login">Sign in</Link>
                )}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="my-6">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input id="email" type="email" value={email} disabled />
                </Field>

                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    autoComplete="new-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
                  <Input
                    id="confirmPassword"
                    type="password"
                    name="confirmPassword"
                    autoComplete="new-password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </Field>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Setting password...' : 'Set password'}
                </Button>

                <FieldDescription className="text-center">
                  <Link className="text-foreground hover:underline" href="/login">
                    Back to sign in
                  </Link>
                </FieldDescription>
              </FieldGroup>
            </form>
          )}
        </AuthBox>
      </Container>
    </Section>
  )
}

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <Section>
          <Container>
            <AuthBox>
              <h1>Loading...</h1>
            </AuthBox>
          </Container>
        </Section>
      }
    >
      <AcceptInvitationForm />
    </Suspense>
  )
}
