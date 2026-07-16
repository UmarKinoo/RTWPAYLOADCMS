import { MiniLoader } from '@/components/ui/mini-loader'
import { getTranslations } from 'next-intl/server'

/**
 * Route-level loader for auth pages (login, password reset, etc.).
 */
export default async function AuthLoading() {
  const t = await getTranslations('common')
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <MiniLoader message={t('loading')} fullScreen size="md" className="min-h-[60vh]" />
    </div>
  )
}
