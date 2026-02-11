import { getTranslations } from 'next-intl/server'
import { getCurrentUserType } from '@/lib/currentUserType'
import {
  redirectToLogin,
  redirectToAdmin,
  redirectToModeratorPanel,
  redirectToEmployerDashboard,
  redirectToDashboard,
} from '@/lib/redirects'
import { Section, Container } from '@/components/ds'
import { AuthBox } from '@/components/auth/auth-box'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/routing'

export const dynamic = 'force-dynamic'

/**
 * Shown when user is authenticated but has no valid role/type (unknown).
 * Stops the login ↔ dashboard redirect loop. Enterprise pattern: "authenticated but unauthorized".
 */
export default async function NoAccessPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const userType = await getCurrentUserType()

  if (!userType) {
    await redirectToLogin(locale)
    throw new Error('Redirect')
  }

  // Only unknown users should land here; others are redirected by layout/page
  if (userType.kind !== 'unknown') {
    if (userType.kind === 'admin') await redirectToAdmin()
    if (userType.kind === 'moderator') await redirectToModeratorPanel(locale)
    if (userType.kind === 'employer') await redirectToEmployerDashboard(locale)
    if (userType.kind === 'candidate') await redirectToDashboard(locale)
  }

  const t = await getTranslations('noAccess')

  return (
    <Section>
      <Container>
        <AuthBox>
          <h1 className="text-xl font-semibold text-[#16252d]">{t('title')}</h1>
          <p className="text-muted-foreground mt-2 mb-4">{t('description')}</p>
          <p className="text-sm text-muted-foreground mb-6">{t('contactSupport')}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="default">
              <Link href="/login">{t('backToLogin')}</Link>
            </Button>
          </div>
        </AuthBox>
      </Container>
    </Section>
  )
}
