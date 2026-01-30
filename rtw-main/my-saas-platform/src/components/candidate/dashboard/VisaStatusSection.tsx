'use client'

import { useTranslations } from 'next-intl'
import { Link as LinkIcon, Edit2, Save, X } from 'lucide-react'
import { useState } from 'react'
import type { Candidate } from '@/payload-types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { updateCandidate } from '@/lib/candidate'
import { toast } from 'sonner'

interface VisaStatusSectionProps {
  candidate: Candidate
  onUpdate: (data: Partial<Candidate>) => void
}

export function VisaStatusSection({ candidate, onUpdate }: VisaStatusSectionProps) {
  const t = useTranslations('candidateDashboard.visaStatus')
  const tCommon = useTranslations('candidateDashboard.common')
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    visaStatus: candidate.visaStatus || 'none',
    visaExpiry: (candidate as any).visaExpiry
      ? new Date((candidate as any).visaExpiry).toISOString().split('T')[0]
      : '',
    visaProfession: (candidate as any).visaProfession || '',
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const result = await updateCandidate(candidate.id, {
        visaStatus: formData.visaStatus as 'active' | 'expired' | 'nearly_expired' | 'none',
        visaExpiry: formData.visaExpiry || undefined,
        visaProfession: formData.visaProfession || undefined,
      })

      if (result.success) {
        onUpdate(result.candidate || {})
        setIsEditing(false)
        toast.success(t('visaStatusUpdated'))
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
      visaStatus: candidate.visaStatus || 'none',
      visaExpiry: (candidate as any).visaExpiry
        ? new Date((candidate as any).visaExpiry).toISOString().split('T')[0]
        : '',
      visaProfession: (candidate as any).visaProfession || '',
    })
    setIsEditing(false)
  }

  const getVisaStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return t('active')
      case 'expired':
        return t('expired')
      case 'nearly_expired':
        return t('nearlyExpired')
      case 'none':
        return t('none')
      default:
        return status
    }
  }

  return (
    <Card className="rounded-xl bg-white p-4 shadow-sm sm:rounded-2xl sm:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between sm:mb-6">
        <div className="flex items-center gap-2">
          <LinkIcon className="size-5 text-[#282828] sm:size-6" />
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
        {/* Visa Status */}
        <Field>
          <FieldLabel className="text-xs text-[#757575]">{t('title')}</FieldLabel>
          {isEditing ? (
            <Select
              value={formData.visaStatus}
              onValueChange={(value) => setFormData({ ...formData, visaStatus: value as 'none' | 'active' | 'expired' | 'nearly_expired' })}
            >
              <SelectTrigger className="h-10 rounded-lg border-[#ededed]">
                <SelectValue placeholder={t('selectVisaStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{t('active')}</SelectItem>
                <SelectItem value="expired">{t('expired')}</SelectItem>
                <SelectItem value="nearly_expired">{t('nearlyExpired')}</SelectItem>
                <SelectItem value="none">{t('none')}</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm font-medium text-[#282828]">
              {getVisaStatusLabel(candidate.visaStatus || 'none')}
            </p>
          )}
        </Field>

        {/* Visa Expiry */}
        <Field>
          <FieldLabel className="text-xs text-[#757575]">{t('visaExpiry')}</FieldLabel>
          {isEditing ? (
            <Input
              type="date"
              value={formData.visaExpiry}
              onChange={(e) => setFormData({ ...formData, visaExpiry: e.target.value })}
              className="h-10 rounded-lg border-[#ededed] text-sm"
            />
          ) : (
            <p className="text-sm font-medium text-[#282828]">
              {(candidate as any).visaExpiry
                ? new Date((candidate as any).visaExpiry).toLocaleDateString()
                : tCommon('notSet')}
            </p>
          )}
        </Field>

        {/* Visa Profession */}
        <Field className="sm:col-span-2">
          <FieldLabel className="text-xs text-[#757575]">{t('visaProfession')}</FieldLabel>
          {isEditing ? (
            <Input
              value={formData.visaProfession}
              onChange={(e) => setFormData({ ...formData, visaProfession: e.target.value })}
              className="h-10 rounded-lg border-[#ededed] text-sm"
              placeholder={t('enterVisaProfession')}
            />
          ) : (
            <p className="text-sm font-medium text-[#282828]">
              {(candidate as any).visaProfession || tCommon('notSet')}
            </p>
          )}
        </Field>
      </div>
    </Card>
  )
}
