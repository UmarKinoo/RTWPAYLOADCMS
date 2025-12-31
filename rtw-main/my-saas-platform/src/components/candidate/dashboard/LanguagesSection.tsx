'use client'

import { Globe, Edit2, Save, X } from 'lucide-react'
import { useState } from 'react'
import type { Candidate } from '@/payload-types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { updateCandidate } from '@/lib/candidate'
import { toast } from 'sonner'

interface LanguagesSectionProps {
  candidate: Candidate
  onUpdate: (data: Partial<Candidate>) => void
}

export function LanguagesSection({ candidate, onUpdate }: LanguagesSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [languages, setLanguages] = useState(candidate.languages || '')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const result = await updateCandidate(candidate.id, {
        languages: languages,
      })

      if (result.success) {
        onUpdate(result.candidate || {})
        setIsEditing(false)
        toast.success('Languages updated successfully')
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
    setLanguages(candidate.languages || '')
    setIsEditing(false)
  }

  return (
    <Card className="rounded-xl bg-white p-4 shadow-sm sm:rounded-2xl sm:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between sm:mb-6">
        <div className="flex items-center gap-2">
          <Globe className="size-5 text-[#282828] sm:size-6" />
          <h3 className="text-base font-semibold text-[#282828] sm:text-lg">Languages</h3>
        </div>
        {!isEditing ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="text-[#4644b8] hover:text-[#4644b8] hover:bg-[#4644b8]/10"
          >
            <Edit2 className="mr-2 size-4" />
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <X className="mr-2 size-4" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#4644b8] hover:bg-[#3a3aa0]"
            >
              <Save className="mr-2 size-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      {isEditing ? (
        <Field>
          <FieldLabel className="text-xs text-[#757575]">Languages</FieldLabel>
          <Input
            value={languages}
            onChange={(e) => setLanguages(e.target.value)}
            placeholder="e.g., English, Arabic, French"
            className="h-10 rounded-lg border-[#ededed] text-sm"
          />
          <p className="mt-1 text-xs text-[#757575]">
            Enter languages separated by commas
          </p>
        </Field>
      ) : (
        <div>
          {candidate.languages ? (
            <div className="flex flex-wrap gap-2">
              {candidate.languages.split(',').map((lang, index) => (
                <Badge
                  key={index}
                  className="bg-[#ededed] text-[#282828] hover:bg-[#e0e0e0] text-xs"
                >
                  {lang.trim()}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm font-medium text-[#757575]">No languages specified</p>
          )}
        </div>
      )}
    </Card>
  )
}
