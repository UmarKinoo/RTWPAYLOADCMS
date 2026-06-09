import { Suspense } from 'react'
import { getLocale } from 'next-intl/server'
import { loadReadyBotDashboard } from '@/lib/readybot/dashboardData'
import { loadReadyBotLiveLogs } from '@/lib/readybot/liveLogs'
import { loadReadyBotSettings } from '@/lib/readybot/settings'
import { getReadyBotTriggerStatus } from '@/lib/readybot/triggerStatus'
import { getReadyBotPayload } from '@/readybot/lib/getReadyBotPayload'
import { ReadyBotDashboard } from '@/components/readybot/ReadyBotDashboard'

export const dynamic = 'force-dynamic'

function DashboardFallback() {
  return (
    <div className="flex items-center justify-center py-24 text-zinc-500 text-sm">
      Loading ReadyBot data…
    </div>
  )
}

export default async function ReadyBotDashboardPage() {
  const locale = await getLocale()
  const payload = await getReadyBotPayload()
  const triggerStatus = getReadyBotTriggerStatus()
  const [data, liveResult, settings] = await Promise.all([
    loadReadyBotDashboard(),
    loadReadyBotLiveLogs().catch(() => ({ logs: [], serverTime: new Date().toISOString() })),
    loadReadyBotSettings(payload),
  ])
  const live = liveResult

  return (
    <Suspense fallback={<DashboardFallback />}>
      <ReadyBotDashboard
        locale={locale}
        data={data}
        initialLiveLogs={live.logs}
        liveServerTime={live.serverTime}
        settings={settings}
        triggerStatus={triggerStatus}
      />
    </Suspense>
  )
}
