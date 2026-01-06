'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function UploadResumeButton() {
  const t = useTranslations('homepage.uploadResume')
  const router = useRouter()
  const pathname = usePathname()
  const locale = pathname.split('/')[1] || 'en'

  const handleClick = () => {
    router.push(`/${locale}/register-type`)
  }

  return (
    <Button
      onClick={handleClick}
      className="bg-[#4644b8] hover:bg-[#3a3aa0] text-white rounded-xl px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-medium uppercase tracking-wide flex items-center gap-3"
    >
      {t('button')}
      <div className="bg-white/20 rounded-lg p-1.5">
        <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>
    </Button>
  )
}


