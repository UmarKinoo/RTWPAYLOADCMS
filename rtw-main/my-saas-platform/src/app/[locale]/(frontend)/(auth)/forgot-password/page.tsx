import { getLocale } from 'next-intl/server'
import { Section, Container } from '@/components/ds'
import { AuthBox } from '@/components/auth/auth-box'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'
import { getUser } from '@/lib/auth'
import { redirectToDashboard } from '@/lib/redirects'
import { Link } from '@/i18n/routing'

import type { User } from '@/payload-types'

export const dynamic = 'force-dynamic'

export default async function ForgotPasswordPage() {
  const user: User | null = await getUser()
  const locale = await getLocale()

  if (user) await redirectToDashboard(locale)

  return (
    <Section>
      <Container>
        <AuthBox>
          <h1>Forgot Password</h1>
          <p className="text-muted-foreground my-4 text-sm">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
          <ForgotPasswordForm />
          <p className="text-muted-foreground text-xs">
            Remember your password?{' '}
            <Link className="text-foreground" href="/login">
              Sign in
            </Link>
          </p>
        </AuthBox>
      </Container>
    </Section>
  )
}
