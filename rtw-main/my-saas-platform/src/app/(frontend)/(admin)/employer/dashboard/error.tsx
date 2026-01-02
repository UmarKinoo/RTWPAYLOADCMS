'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Don't log redirect errors - they're expected in Next.js
    if (error.digest?.startsWith('NEXT_REDIRECT')) {
      return
    }
    console.error('Employer dashboard error:', error)
  }, [error])

  // Don't show error UI for redirects - they're handled by Next.js
  if (error.digest?.startsWith('NEXT_REDIRECT')) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-semibold text-[#16252d]">Something went wrong!</h2>
        <p className="text-[#757575]">{error.message}</p>
        <Button onClick={reset} className="bg-[#4644b8] hover:bg-[#4644b8]/90">
          Try again
        </Button>
      </div>
    </div>
  )
}


