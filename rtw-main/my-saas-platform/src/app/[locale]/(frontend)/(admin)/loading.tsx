import { MiniLoader } from '@/components/ui/mini-loader'
import { getTranslations } from 'next-intl/server'

/**
 * Route-level loader for authenticated areas (employer/candidate/moderator
 * dashboards) — shown instantly while the destination page renders.
 */
export default async function AdminLoading() {
  const t = await getTranslations('common')
  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa]">
      <MiniLoader message={t('loading')} fullScreen size="lg" className="min-h-[70vh]" />
    </div>
  )
}
