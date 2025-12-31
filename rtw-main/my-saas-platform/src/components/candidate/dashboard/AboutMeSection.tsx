'use client'

import { User as UserAlt, Plus } from 'lucide-react'
import type { Candidate } from '@/payload-types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface AboutMeSectionProps {
  candidate: Candidate
  onUpdate: (data: Partial<Candidate>) => void
}

export function AboutMeSection({ candidate, onUpdate }: AboutMeSectionProps) {
  return (
    <Card className="rounded-xl bg-white p-4 shadow-sm sm:rounded-2xl sm:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2 sm:mb-6">
        <UserAlt className="size-5 text-[#282828] sm:size-6" />
        <h3 className="text-base font-semibold text-[#282828] sm:text-lg">About me</h3>
      </div>

      {/* Content */}
      <div className="flex min-h-[120px] flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-[#ededed] p-4 sm:min-h-[140px]">
        <p className="text-sm font-medium text-[#757575]">Add something about yourself</p>
        <Button
          variant="outline"
          className="border-[#4644b8] text-[#4644b8] hover:bg-[#4644b8] hover:text-white"
        >
          <Plus className="mr-2 size-4" />
          About me
        </Button>
      </div>
    </Card>
  )
}
