'use client'

import { useState } from 'react'
import { Briefcase, Edit2, Save, X, Loader2 } from 'lucide-react'
import type { Candidate } from '@/payload-types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateCandidate } from '@/lib/candidate'
import { toast } from 'sonner'

interface JobPreferencesSectionProps {
  candidate: Candidate
  onUpdate: (data: Partial<Candidate>) => void
}

export function JobPreferencesSection({ candidate, onUpdate }: JobPreferencesSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const preferences = (candidate as any).jobPreferences || {}
  const [formData, setFormData] = useState({
    preferredJobTitle: preferences.preferredJobTitle || '',
    preferredLocation: preferences.preferredLocation || '',
    preferredSalary: preferences.preferredSalary || '',
    workType: preferences.workType || 'any',
    shiftPreference: preferences.shiftPreference || 'any',
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const result = await updateCandidate(candidate.id, {
        jobPreferences: formData,
      } as any)

      if (result.success) {
        onUpdate(result.candidate || {})
        setIsEditing(false)
        toast.success('Job preferences updated successfully')
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
    setFormData({
      preferredJobTitle: preferences.preferredJobTitle || '',
      preferredLocation: preferences.preferredLocation || '',
      preferredSalary: preferences.preferredSalary || '',
      workType: preferences.workType || 'any',
      shiftPreference: preferences.shiftPreference || 'any',
    })
    setIsEditing(false)
  }

  const hasPreferences = Object.values(preferences).some((v) => v && v !== 'any')

  return (
    <Card className="rounded-xl bg-white p-4 shadow-sm sm:rounded-2xl sm:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between sm:mb-6">
        <div className="flex items-center gap-2">
          <Briefcase className="size-5 text-[#282828] sm:size-6" />
          <h3 className="text-base font-semibold text-[#282828] sm:text-lg">Job Preferences</h3>
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-[#282828]">Preferred Job Title</label>
              <Input
                value={formData.preferredJobTitle}
                onChange={(e) => setFormData({ ...formData, preferredJobTitle: e.target.value })}
                placeholder="e.g., Software Engineer"
                className="h-9"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[#282828]">Preferred Location</label>
              <Input
                value={formData.preferredLocation}
                onChange={(e) => setFormData({ ...formData, preferredLocation: e.target.value })}
                placeholder="e.g., Riyadh, Jeddah"
                className="h-9"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[#282828]">Preferred Salary Range</label>
              <Input
                value={formData.preferredSalary}
                onChange={(e) => setFormData({ ...formData, preferredSalary: e.target.value })}
                placeholder="e.g., 5000-8000 SAR"
                className="h-9"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[#282828]">Work Type</label>
              <Select value={formData.workType} onValueChange={(value) => setFormData({ ...formData, workType: value })}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="freelance">Freelance</SelectItem>
                  <SelectItem value="any">Any</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[#282828]">Shift Preference</label>
              <Select value={formData.shiftPreference} onValueChange={(value) => setFormData({ ...formData, shiftPreference: value })}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day Shift</SelectItem>
                  <SelectItem value="night">Night Shift</SelectItem>
                  <SelectItem value="rotating">Rotating</SelectItem>
                  <SelectItem value="any">Any</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel} disabled={isSaving} className="h-9">
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
      ) : (
        <div className="min-h-[120px]">
          {hasPreferences ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {preferences.preferredJobTitle && (
                <div>
                  <p className="text-xs font-medium text-[#757575]">Preferred Job Title</p>
                  <p className="mt-1 text-sm text-[#282828]">{preferences.preferredJobTitle}</p>
                </div>
              )}
              {preferences.preferredLocation && (
                <div>
                  <p className="text-xs font-medium text-[#757575]">Preferred Location</p>
                  <p className="mt-1 text-sm text-[#282828]">{preferences.preferredLocation}</p>
                </div>
              )}
              {preferences.preferredSalary && (
                <div>
                  <p className="text-xs font-medium text-[#757575]">Preferred Salary</p>
                  <p className="mt-1 text-sm text-[#282828]">{preferences.preferredSalary}</p>
                </div>
              )}
              {preferences.workType && preferences.workType !== 'any' && (
                <div>
                  <p className="text-xs font-medium text-[#757575]">Work Type</p>
                  <p className="mt-1 text-sm text-[#282828] capitalize">{preferences.workType.replace('-', ' ')}</p>
                </div>
              )}
              {preferences.shiftPreference && preferences.shiftPreference !== 'any' && (
                <div>
                  <p className="text-xs font-medium text-[#757575]">Shift Preference</p>
                  <p className="mt-1 text-sm text-[#282828] capitalize">{preferences.shiftPreference}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex min-h-[120px] flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-[#ededed] p-4">
              <p className="text-sm font-medium text-[#757575]">No preferences set yet</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="border-[#4644b8] text-[#4644b8] hover:bg-[#4644b8] hover:text-white"
              >
                Add Preferences
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
