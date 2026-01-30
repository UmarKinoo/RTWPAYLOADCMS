'use client'

import { useTranslations } from 'next-intl'
import { Building, Edit2, Save, X } from 'lucide-react'
import { useState } from 'react'
import type { Candidate } from '@/payload-types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'
import { Card } from '@/components/ui/card'
import { updateCandidate } from '@/lib/candidate'
import { toast } from 'sonner'

interface WorkExperienceSectionProps {
  candidate: Candidate
  onUpdate: (data: Partial<Candidate>) => void
}

export function WorkExperienceSection({ candidate, onUpdate }: WorkExperienceSectionProps) {
  const t = useTranslations('candidateDashboard.workExperience')
  const tCommon = useTranslations('candidateDashboard.common')
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    jobTitle: candidate.jobTitle || '',
    experienceYears: candidate.experienceYears?.toString() || '0',
    saudiExperience: (candidate as any).saudiExperience?.toString() || '0',
    currentEmployer: (candidate as any).currentEmployer || '',
    availabilityDate: candidate.availabilityDate
      ? new Date(candidate.availabilityDate).toISOString().split('T')[0]
      : '',
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const result = await updateCandidate(candidate.id, {
        jobTitle: formData.jobTitle,
        experienceYears: parseInt(formData.experienceYears, 10),
        saudiExperience: parseInt(formData.saudiExperience, 10),
        currentEmployer: formData.currentEmployer || undefined,
        availabilityDate: formData.availabilityDate,
      })

      if (result.success) {
        onUpdate(result.candidate || {})
        setIsEditing(false)
        toast.success(t('workExperienceUpdated'))
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
      jobTitle: candidate.jobTitle || '',
      experienceYears: candidate.experienceYears?.toString() || '0',
      saudiExperience: (candidate as any).saudiExperience?.toString() || '0',
      currentEmployer: (candidate as any).currentEmployer || '',
      availabilityDate: candidate.availabilityDate
        ? new Date(candidate.availabilityDate).toISOString().split('T')[0]
        : '',
    })
    setIsEditing(false)
  }

  return (
    <Card className="rounded-xl bg-white p-4 shadow-sm sm:rounded-2xl sm:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between sm:mb-6">
        <div className="flex items-center gap-2">
          <Building className="size-5 text-[#282828] sm:size-6" />
          <h3 className="text-base font-semibold text-[#282828] sm:text-lg">{t('title')}</h3>
        </div>
        {!isEditing ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="text-[#4644b8] hover:text-[#4644b8] hover:bg-[#4644b8]/10"
          >
            <Edit2 className="mr-2 size-4" />
            {tCommon('edit')}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <X className="mr-2 size-4" />
              {tCommon('cancel')}
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#4644b8] hover:bg-[#3a3aa0]"
            >
              <Save className="mr-2 size-4" />
              {isSaving ? tCommon('saving') : tCommon('save')}
            </Button>
          </div>
        )}
      </div>

      {/* Form Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        {/* Job Title */}
        <Field>
          <FieldLabel className="text-xs text-[#757575]">{t('jobTitle')}</FieldLabel>
          {isEditing ? (
            <Input
              value={formData.jobTitle}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              className="h-10 rounded-lg border-[#ededed] text-sm"
            />
          ) : (
            <p className="text-sm font-medium text-[#282828]">
              {candidate.jobTitle || tCommon('notSet')}
            </p>
          )}
        </Field>

        {/* Current Employer */}
        <Field>
          <FieldLabel className="text-xs text-[#757575]">{t('currentEmployer')}</FieldLabel>
          {isEditing ? (
            <Input
              value={formData.currentEmployer}
              onChange={(e) => setFormData({ ...formData, currentEmployer: e.target.value })}
              className="h-10 rounded-lg border-[#ededed] text-sm"
            />
          ) : (
            <p className="text-sm font-medium text-[#282828]">
              {(candidate as any).currentEmployer || tCommon('notSet')}
            </p>
          )}
        </Field>

        {/* Total Experience */}
        <Field>
          <FieldLabel className="text-xs text-[#757575]">{t('totalExperienceYears')}</FieldLabel>
          {isEditing ? (
            <Input
              type="number"
              min="0"
              value={formData.experienceYears}
              onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
              className="h-10 rounded-lg border-[#ededed] text-sm"
            />
          ) : (
            <p className="text-sm font-medium text-[#282828]">
              {candidate.experienceYears || 0} {t('years')}
            </p>
          )}
        </Field>

        {/* Saudi Experience */}
        <Field>
          <FieldLabel className="text-xs text-[#757575]">{t('saudiExperienceYears')}</FieldLabel>
          {isEditing ? (
            <Input
              type="number"
              min="0"
              value={formData.saudiExperience}
              onChange={(e) => setFormData({ ...formData, saudiExperience: e.target.value })}
              className="h-10 rounded-lg border-[#ededed] text-sm"
            />
          ) : (
            <p className="text-sm font-medium text-[#282828]">
              {(candidate as any).saudiExperience || 0} {t('years')}
            </p>
          )}
        </Field>

        {/* Availability Date */}
        <Field className="sm:col-span-2">
          <FieldLabel className="text-xs text-[#757575]">{t('availabilityDate')}</FieldLabel>
          {isEditing ? (
            <Input
              type="date"
              value={formData.availabilityDate}
              onChange={(e) => setFormData({ ...formData, availabilityDate: e.target.value })}
              className="h-10 rounded-lg border-[#ededed] text-sm"
            />
          ) : (
            <p className="text-sm font-medium text-[#282828]">
              {candidate.availabilityDate
                ? new Date(candidate.availabilityDate).toLocaleDateString()
                : tCommon('notSet')}
            </p>
          )}
        </Field>
      </div>
    </Card>
  )
}
