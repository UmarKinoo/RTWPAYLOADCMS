import { getLocale } from 'next-intl/server'
import { getCurrentUserType } from '@/lib/currentUserType'
import { redirectToLogin, redirectToDashboard } from '@/lib/redirects'
import { ReadyBotShell } from '@/components/readybot/ReadyBotShell'
import { getReadyBotPayload } from '@/readybot/lib/getReadyBotPayload'
import { assertReadyBotPageEnabled } from '@/lib/readybot/isReadyBotEnabled'
import { readybotDark } from '@/components/readybot/readybot-ui'

export const dynamic = 'force-dynamic'

type Props = Readonly<{
  children: React.ReactNode
}>

export default async function ReadyBotLayout({ children }: Props) {
  assertReadyBotPageEnabled()
  const locale = await getLocale()
  const userType = await getCurrentUserType()

  if (!userType) {
    await redirectToLogin(locale)
    throw new Error('Redirect')
  }

  if (userType.kind !== 'admin') {
    await redirectToDashboard(locale)
    throw new Error('Redirect')
  }

  const payload = await getReadyBotPayload()
  const pending = await payload.count({
    collection: 'human-review-tasks',
    where: { status: { equals: 'pending' } },
    overrideAccess: true,
  })

  return (
    <div className={readybotDark.page}>
      <ReadyBotShell locale={locale} pendingReviewCount={pending.totalDocs}>
        {children}
      </ReadyBotShell>
    </div>
  )
}
