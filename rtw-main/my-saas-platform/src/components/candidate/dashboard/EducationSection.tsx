'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { GraduationCap, Plus, Edit2, Trash2, Save, X, Loader2 } from 'lucide-react'
import type { Candidate } from '@/payload-types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { updateCandidate } from '@/lib/candidate'
import { toast } from 'sonner'

interface Education {
  degree?: string
  institution?: string
  fieldOfStudy?: string
  graduationYear?: number
  description?: string
  id?: string
}

interface EducationSectionProps {
  candidate: Candidate
  onUpdate: (data: Partial<Candidate>) => void
}

export function EducationSection({ candidate, onUpdate }: EducationSectionProps) {
  const t = useTranslations('candidateDashboard.education')
  const tCommon = useTranslations('candidateDashboard.common')
  const [isAdding, setIsAdding] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [educations, setEducations] = useState<Education[]>((candidate as any).education || [])
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<Education>({
    degree: '',
    institution: '',
    fieldOfStudy: '',
    graduationYear: undefined,
    description: '',
  })

  const handleAdd = () => {
    setIsAdding(true)
    setFormData({
      degree: '',
      institution: '',
      fieldOfStudy: '',
      graduationYear: undefined,
      description: '',
    })
  }

  const handleEdit = (index: number) => {
    setEditingIndex(index)
    setFormData(educations[index])
    setIsAdding(false)
  }

  const handleDelete = async (index: number) => {
    const newEducations = educations.filter((_, i) => i !== index)
    setEducations(newEducations)
    await saveEducations(newEducations)
  }

  const handleSave = async () => {
    if (!formData.degree || !formData.institution) {
      toast.error(t('fillDegreeInstitution'))
      return
    }

    let newEducations: Education[]
    if (editingIndex !== null) {
      newEducations = [...educations]
      newEducations[editingIndex] = formData
    } else {
      newEducations = [...educations, { ...formData, id: Date.now().toString() }]
    }

    setEducations(newEducations)
    setIsAdding(false)
    setEditingIndex(null)
    setFormData({
      degree: '',
      institution: '',
      fieldOfStudy: '',
      graduationYear: undefined,
      description: '',
    })
    await saveEducations(newEducations)
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingIndex(null)
    setFormData({
      degree: '',
      institution: '',
      fieldOfStudy: '',
      graduationYear: undefined,
      description: '',
    })
  }

  const saveEducations = async (newEducations: Education[]) => {
    setIsSaving(true)
    try {
      const result = await updateCandidate(candidate.id, {
        education: newEducations,
      } as any)

      if (result.success) {
        onUpdate(result.candidate || {})
        toast.success(t('educationUpdated'))
      } else {
        toast.error(result.error || tCommon('failedToUpdate'))
        setEducations((candidate as any).education || [])
      }
    } catch (error) {
      toast.error(tCommon('anErrorOccurred'))
      setEducations((candidate as any).education || [])
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="rounded-xl bg-white p-4 shadow-sm sm:rounded-2xl sm:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between sm:mb-6">
        <div className="flex items-center gap-2">
          <GraduationCap className="size-5 text-[#282828] sm:size-6" />
          <h3 className="text-base font-semibold text-[#282828] sm:text-lg">{t('title')}</h3>
        </div>
        {!isAdding && editingIndex === null && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleAdd}
            className="h-8 gap-2 border-[#4644b8] text-[#4644b8] hover:bg-[#4644b8] hover:text-white"
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">{tCommon('add')}</span>
          </Button>
        )}
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingIndex !== null) && (
        <div className="mb-4 space-y-3 rounded-lg border border-[#ededed] bg-[#fafafa] p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-[#282828]">
                {t('degreeCertification')} <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.degree}
                onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                placeholder={t('degreePlaceholder')}
                className="h-9"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[#282828]">
                {t('institution')} <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.institution}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                placeholder={t('institutionPlaceholder')}
                className="h-9"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[#282828]">{t('fieldOfStudy')}</label>
              <Input
                value={formData.fieldOfStudy}
                onChange={(e) => setFormData({ ...formData, fieldOfStudy: e.target.value })}
                placeholder={t('fieldPlaceholder')}
                className="h-9"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[#282828]">{t('graduationYear')}</label>
              <Input
                type="number"
                value={formData.graduationYear || ''}
                onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder={t('yearPlaceholder')}
                className="h-9"
                min="1900"
                max="2100"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#282828]">{t('description')}</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('descriptionPlaceholder')}
              className="min-h-[80px] resize-none text-sm"
            />
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
      )}

      {/* Education List */}
      {educations.length > 0 ? (
        <div className="space-y-3">
          {educations.map((edu, index) => (
            <div
              key={edu.id || index}
              className="rounded-lg border border-[#ededed] bg-white p-4 transition-colors hover:border-[#4644b8]/30"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-[#282828]">{edu.degree}</h4>
                  <p className="mt-1 text-sm text-[#515151]">{edu.institution}</p>
                  {(edu.fieldOfStudy || edu.graduationYear) && (
                    <p className="mt-1 text-xs text-[#757575]">
                      {edu.fieldOfStudy}
                      {edu.fieldOfStudy && edu.graduationYear && ' • '}
                      {edu.graduationYear}
                    </p>
                  )}
                  {edu.description && (
                    <p className="mt-2 text-sm text-[#515151]">{edu.description}</p>
                  )}
                </div>
                <div className="ml-4 flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(index)}
                    className="h-8 w-8 text-[#4644b8] hover:bg-[#4644b8]/10"
                  >
                    <Edit2 className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(index)}
                    className="h-8 w-8 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !isAdding && (
        <div className="flex min-h-[120px] flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-[#ededed] p-4">
          <p className="text-sm font-medium text-[#757575]">{t('noEducationAddedYet')}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAdd}
            className="border-[#4644b8] text-[#4644b8] hover:bg-[#4644b8] hover:text-white"
          >
            <Plus className="mr-2 size-4" />
            {t('addEducation')}
          </Button>
        </div>
      )}
    </Card>
  )
}
