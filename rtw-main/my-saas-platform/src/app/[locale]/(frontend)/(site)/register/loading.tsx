import { MiniLoader } from '@/components/ui/mini-loader'
import { getTranslations } from 'next-intl/server'

/**
 * Shown immediately when navigating to candidate registration (e.g. from register-type).
 * Keeps the same mini loader style used elsewhere on the site.
 */
export default async function RegisterLoading() {
  const t = await getTranslations('registration')
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <MiniLoader message={t('loading')} fullScreen size="md" className="min-h-[60vh]" />
    </div>
  )
}
