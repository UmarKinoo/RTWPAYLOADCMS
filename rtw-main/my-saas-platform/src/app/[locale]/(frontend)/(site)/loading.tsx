import { MiniLoader } from '@/components/ui/mini-loader'
import { getTranslations } from 'next-intl/server'

/**
 * Route-level loader for all public site pages (candidates, pricing, etc.) —
 * shown instantly while the destination page renders on the server.
 */
export default async function SiteLoading() {
  const t = await getTranslations('common')
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <MiniLoader message={t('loading')} fullScreen size="lg" className="min-h-[70vh]" />
    </div>
  )
}
