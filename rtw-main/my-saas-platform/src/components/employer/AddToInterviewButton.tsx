'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { InterviewRequestModal } from './InterviewRequestModal'
import type { CandidateDetail, CandidateListItem } from '@/lib/payload/candidates'

interface AddToInterviewButtonProps {
  candidate: CandidateDetail | CandidateListItem
  variant?: 'default' | 'outline'
  className?: string
}

export function AddToInterviewButton({
  candidate,
  variant = 'default',
  className,
}: AddToInterviewButtonProps) {
  const t = useTranslations('requestInterview')
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (variant === 'outline') {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className={cn(
            'mt-2 rounded-lg',
            'h-8 px-2.5 text-xs font-medium',
            'flex items-center gap-1.5',
            'bg-[rgba(151,185,255,0.1)] border-0 text-[#4644b8] hover:bg-[rgba(151,185,255,0.2)] hover:text-[#4644b8]',
            className
          )}
        >
          <span className="hidden sm:inline">{t('addToInterview')}</span>
          <span className="sm:hidden">{t('add')}</span>
          <Plus className="w-3.5 h-3.5" />
        </Button>
        <InterviewRequestModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          candidate={candidate}
        />
      </>
    )
  }

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        className={cn(
          'mt-4 sm:mt-6 bg-[#4644b8] hover:bg-[#3a3aa0] text-white hover:text-white',
          'rounded-xl h-12 sm:h-14 px-6 sm:px-8',
          'text-[16px] sm:text-[18px] md:text-[20px] font-medium font-inter',
          'flex items-center gap-3',
          className
        )}
      >
        <span>{t('addToInterview')}</span>
        <Plus className="w-6 h-6" />
      </Button>
      <InterviewRequestModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        candidate={candidate}
      />
    </>
  )
}

