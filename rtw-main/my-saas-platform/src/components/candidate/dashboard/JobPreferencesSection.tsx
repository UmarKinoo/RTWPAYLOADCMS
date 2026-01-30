'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('candidateDashboard.jobPreferences')
  const tCommon = useTranslations('candidateDashboard.common')
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
        toast.success(t('jobPreferencesUpdated'))
      } else {
        toast.error(result.error || tCommon('failedToUpdate'))
      }
    } catch (error) {
      toast.error(tCommon('anErrorOccurred'))
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
          <h3 className="text-base font-semibold text-[#282828] sm:text-lg">{t('title')}</h3>
        </div>
        {!isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="h-8 gap-2 text-[#4644b8] hover:bg-[#4644b8]/10"
          >
            <Edit2 className="size-4" />
            <span className="hidden sm:inline">{tCommon('edit')}</span>
          </Button>
        )}
      </div>

      {/* Content */}
      {isEditing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-[#282828]">{t('preferredJobTitle')}</label>
              <Input
                value={formData.preferredJobTitle}
                onChange={(e) => setFormData({ ...formData, preferredJobTitle: e.target.value })}
                placeholder={t('jobTitlePlaceholder')}
                className="h-9"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[#282828]">{t('preferredLocation')}</label>
              <Input
                value={formData.preferredLocation}
                onChange={(e) => setFormData({ ...formData, preferredLocation: e.target.value })}
                placeholder="e.g., Riyadh, Jeddah"
                className="h-9"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[#282828]">{t('preferredSalary')}</label>
              <Input
                value={formData.preferredSalary}
                onChange={(e) => setFormData({ ...formData, preferredSalary: e.target.value })}
                placeholder="e.g., 5000-8000 SAR"
                className="h-9"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[#282828]">{t('workType')}</label>
              <Select value={formData.workType} onValueChange={(value) => setFormData({ ...formData, workType: value })}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">{t('fullTime')}</SelectItem>
                  <SelectItem value="part-time">{t('partTime')}</SelectItem>
                  <SelectItem value="contract">{t('contract')}</SelectItem>
                  <SelectItem value="freelance">{t('freelance')}</SelectItem>
                  <SelectItem value="any">{t('any')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[#282828]">{t('shiftPreference')}</label>
              <Select value={formData.shiftPreference} onValueChange={(value) => setFormData({ ...formData, shiftPreference: value })}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">{t('day')}</SelectItem>
                  <SelectItem value="night">{t('night')}</SelectItem>
                  <SelectItem value="rotating">{t('rotating')}</SelectItem>
                  <SelectItem value="any">{t('any')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel} disabled={isSaving} className="h-9">
              <X className="mr-2 size-4" />
              {tCommon('cancel')}
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
                  {tCommon('saving')}
                </>
              ) : (
                <>
                  <Save className="mr-2 size-4" />
                  {tCommon('save')}
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
                  <p className="text-xs font-medium text-[#757575]">{t('preferredJobTitle')}</p>
                  <p className="mt-1 text-sm text-[#282828]">{preferences.preferredJobTitle}</p>
                </div>
              )}
              {preferences.preferredLocation && (
                <div>
                  <p className="text-xs font-medium text-[#757575]">{t('preferredLocation')}</p>
                  <p className="mt-1 text-sm text-[#282828]">{preferences.preferredLocation}</p>
                </div>
              )}
              {preferences.preferredSalary && (
                <div>
                  <p className="text-xs font-medium text-[#757575]">{t('preferredSalary')}</p>
                  <p className="mt-1 text-sm text-[#282828]">{preferences.preferredSalary}</p>
                </div>
              )}
              {preferences.workType && preferences.workType !== 'any' && (
                <div>
                  <p className="text-xs font-medium text-[#757575]">{t('workType')}</p>
                  <p className="mt-1 text-sm text-[#282828] capitalize">{preferences.workType.replace('-', ' ')}</p>
                </div>
              )}
              {preferences.shiftPreference && preferences.shiftPreference !== 'any' && (
                <div>
                  <p className="text-xs font-medium text-[#757575]">{t('shiftPreference')}</p>
                  <p className="mt-1 text-sm text-[#282828] capitalize">{preferences.shiftPreference}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex min-h-[120px] flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-[#ededed] p-4">
              <p className="text-sm font-medium text-[#757575]">{t('noPreferencesSetYet')}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="border-[#4644b8] text-[#4644b8] hover:bg-[#4644b8] hover:text-white"
              >
                {t('addPreferences')}
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
