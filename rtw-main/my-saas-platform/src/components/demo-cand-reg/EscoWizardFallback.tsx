'use client'

import { MiniLoader } from '@/components/ui/mini-loader'

export function EscoWizardFallback() {
  return (
    <MiniLoader
      fullScreen
      size="md"
      className="min-h-[60vh]"
    />
  )
}
