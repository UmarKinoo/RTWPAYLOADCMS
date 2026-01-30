'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { User as UserIcon, Edit2, Save, X } from 'lucide-react'
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

interface PersonalInfoSectionProps {
  candidate: Candidate
  onUpdate: (data: Partial<Candidate>) => void
}

export function PersonalInfoSection({ candidate, onUpdate }: PersonalInfoSectionProps) {
  const t = useTranslations('candidateDashboard.personalInfo')
  const tCommon = useTranslations('candidateDashboard.common')
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    firstName: candidate.firstName || '',
    lastName: candidate.lastName || '',
    email: candidate.email || '',
    phone: candidate.phone || '',
    whatsapp: (candidate as any).whatsapp || '',
    gender: candidate.gender || '',
    dob: candidate.dob || '',
    nationality: candidate.nationality || '',
    location: candidate.location || '',
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const result = await updateCandidate(candidate.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        whatsapp: formData.whatsapp,
        gender: formData.gender as 'male' | 'female',
        dob: formData.dob,
        nationality: formData.nationality,
        location: formData.location,
      })

      if (result.success) {
        onUpdate(result.candidate || {})
        setIsEditing(false)
        toast.success(t('personalInfoUpdated'))
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
      firstName: candidate.firstName || '',
      lastName: candidate.lastName || '',
      email: (candidate as any).email || '',
      phone: candidate.phone || '',
      whatsapp: (candidate as any).whatsapp || '',
      gender: candidate.gender || '',
      dob: candidate.dob || '',
      nationality: candidate.nationality || '',
      location: candidate.location || '',
    })
    setIsEditing(false)
  }

  return (
    <Card className="rounded-xl bg-white p-4 shadow-sm sm:rounded-2xl sm:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between sm:mb-6">
        <div className="flex items-center gap-2">
          <UserIcon className="size-5 text-[#282828] sm:size-6" />
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
        {/* First name */}
        <Field>
          <FieldLabel className="text-xs text-[#757575]">{t('firstName')}</FieldLabel>
          {isEditing ? (
            <Input
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="h-10 rounded-lg border-[#ededed] text-sm"
            />
          ) : (
            <p className="text-sm font-medium text-[#282828]">{candidate.firstName}</p>
          )}
        </Field>

        {/* Last name */}
        <Field>
          <FieldLabel className="text-xs text-[#757575]">{t('lastName')}</FieldLabel>
          {isEditing ? (
            <Input
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="h-10 rounded-lg border-[#ededed] text-sm"
            />
          ) : (
            <p className="text-sm font-medium text-[#282828]">{candidate.lastName}</p>
          )}
        </Field>

        {/* Email */}
        <Field>
          <FieldLabel className="text-xs text-[#757575]">{t('emailAddress')}</FieldLabel>
          <p className="text-sm font-medium text-[#282828]">{formData.email}</p>
        </Field>

        {/* Mobile Number */}
        <Field>
          <FieldLabel className="text-xs text-[#757575]">{t('mobileNumber')}</FieldLabel>
          {isEditing ? (
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="h-10 rounded-lg border-[#ededed] text-sm"
            />
          ) : (
            <p className="text-sm font-medium text-[#282828]"><span dir="ltr">{candidate.phone || tCommon('notSet')}</span></p>
          )}
        </Field>

        {/* WhatsApp */}
        <Field>
          <FieldLabel className="text-xs text-[#757575]">{t('whatsAppNumber')}</FieldLabel>
          {isEditing ? (
            <Input
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              className="h-10 rounded-lg border-[#ededed] text-sm"
            />
          ) : (
            <p className="text-sm font-medium text-[#282828]">{formData.whatsapp || tCommon('notSet')}</p>
          )}
        </Field>

        {/* Location */}
        <Field>
          <FieldLabel className="text-xs text-[#757575]">{t('location')}</FieldLabel>
          {isEditing ? (
            <Input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="h-10 rounded-lg border-[#ededed] text-sm"
            />
          ) : (
            <p className="text-sm font-medium text-[#282828]">{candidate.location || tCommon('notSet')}</p>
          )}
        </Field>

        {/* Date of Birth */}
        <Field>
          <FieldLabel className="text-xs text-[#757575]">{t('dateOfBirth')}</FieldLabel>
          {isEditing ? (
            <Input
              type="date"
              value={formData.dob ? new Date(formData.dob).toISOString().split('T')[0] : ''}
              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
              className="h-10 rounded-lg border-[#ededed] text-sm"
            />
          ) : (
            <p className="text-sm font-medium text-[#282828]">
              {candidate.dob ? new Date(candidate.dob).toLocaleDateString() : tCommon('notSet')}
            </p>
          )}
        </Field>

        {/* Gender */}
        <Field>
          <FieldLabel className="text-xs text-[#757575]">{t('gender')}</FieldLabel>
          {isEditing ? (
            <Select
              value={formData.gender}
              onValueChange={(value) => setFormData({ ...formData, gender: value as 'male' | 'female' })}
            >
              <SelectTrigger className="h-10 rounded-lg border-[#ededed]">
                <SelectValue placeholder={t('selectGender')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">{t('male')}</SelectItem>
                <SelectItem value="female">{t('female')}</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm font-medium text-[#282828]">
              {candidate.gender === 'male' ? t('male') : candidate.gender === 'female' ? t('female') : tCommon('notSet')}
            </p>
          )}
        </Field>

        {/* Nationality */}
        <Field className="sm:col-span-2">
          <FieldLabel className="text-xs text-[#757575]">{t('nationality')}</FieldLabel>
          {isEditing ? (
            <Input
              value={formData.nationality}
              onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
              className="h-10 rounded-lg border-[#ededed] text-sm"
            />
          ) : (
            <p className="text-sm font-medium text-[#282828]">{candidate.nationality || tCommon('notSet')}</p>
          )}
        </Field>
      </div>
    </Card>
  )
}
