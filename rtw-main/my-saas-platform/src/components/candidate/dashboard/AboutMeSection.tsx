'use client'

import { useState } from 'react'
import { User as UserAlt, Edit2, Save, X, Loader2 } from 'lucide-react'
import type { Candidate } from '@/payload-types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { updateCandidate } from '@/lib/candidate'
import { toast } from 'sonner'

interface AboutMeSectionProps {
  candidate: Candidate
  onUpdate: (data: Partial<Candidate>) => void
}

export function AboutMeSection({ candidate, onUpdate }: AboutMeSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [aboutMe, setAboutMe] = useState((candidate as any).aboutMe || '')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const result = await updateCandidate(candidate.id, {
        aboutMe: aboutMe,
      } as any)

      if (result.success) {
        onUpdate(result.candidate || {})
        setIsEditing(false)
        toast.success('About me updated successfully')
      } else {
        toast.error(result.error || 'Failed to update')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setAboutMe((candidate as any).aboutMe || '')
    setIsEditing(false)
  }

  return (
    <Card className="rounded-xl bg-white p-4 shadow-sm sm:rounded-2xl sm:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between sm:mb-6">
        <div className="flex items-center gap-2">
          <UserAlt className="size-5 text-[#282828] sm:size-6" />
          <h3 className="text-base font-semibold text-[#282828] sm:text-lg">About me</h3>
        </div>
        {!isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="h-8 gap-2 text-[#4644b8] hover:bg-[#4644b8]/10"
          >
            <Edit2 className="size-4" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
        )}
      </div>

      {/* Content */}
      {isEditing ? (
        <div className="space-y-4">
          <Textarea
            value={aboutMe}
            onChange={(e) => setAboutMe(e.target.value)}
            placeholder="Tell employers about yourself, your background, skills, and what makes you unique..."
            className="min-h-[200px] resize-none text-sm"
            maxLength={2000}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#757575]">
              {aboutMe.length}/2000 characters
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isSaving}
                className="h-9"
              >
                <X className="mr-2 size-4" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="h-9 bg-[#4644b8] hover:bg-[#3a3aa0]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 size-4" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-[120px]">
          {aboutMe ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#515151]">
              {aboutMe}
            </p>
          ) : (
            <div className="flex min-h-[120px] flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-[#ededed] p-4">
              <p className="text-sm font-medium text-[#757575]">No information added yet</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="border-[#4644b8] text-[#4644b8] hover:bg-[#4644b8] hover:text-white"
              >
                Add about me
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
