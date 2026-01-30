'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Sparkles, Plus, Save, X, Loader2, Trash2 } from 'lucide-react'
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

interface Benefit {
  benefit: string
  otherBenefit?: string
  id?: string
}

interface JobBenefitsSectionProps {
  candidate: Candidate
  onUpdate: (data: Partial<Candidate>) => void
}

const BENEFIT_OPTION_KEYS = [
  'healthInsurance', 'accommodationProvided', 'transportationProvided', 'annualLeave', 'endOfService',
  'training', 'performanceBonus', 'overtimePay', 'mealAllowance', 'other',
] as const
const BENEFIT_VALUES = [
  'health_insurance', 'accommodation', 'transportation', 'annual_leave', 'end_of_service',
  'training', 'performance_bonus', 'overtime_pay', 'meal_allowance', 'other',
] as const

export function JobBenefitsSection({ candidate, onUpdate }: JobBenefitsSectionProps) {
  const t = useTranslations('candidateDashboard.jobBenefits')
  const tCommon = useTranslations('candidateDashboard.common')
  const [isAdding, setIsAdding] = useState(false)
  const [benefits, setBenefits] = useState<Benefit[]>((candidate as any).preferredBenefits || [])
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<Benefit>({
    benefit: '',
    otherBenefit: '',
  })

  const handleAdd = () => {
    setIsAdding(true)
    setFormData({
      benefit: '',
      otherBenefit: '',
    })
  }

  const handleDelete = async (index: number) => {
    const newBenefits = benefits.filter((_, i) => i !== index)
    setBenefits(newBenefits)
    await saveBenefits(newBenefits)
  }

  const handleSave = async () => {
    if (!formData.benefit) {
      toast.error(t('selectBenefit'))
      return
    }

    if (formData.benefit === 'other' && !formData.otherBenefit) {
      toast.error(t('specifyOtherBenefit'))
      return
    }

    const newBenefits = [...benefits, { ...formData, id: Date.now().toString() }]
    setBenefits(newBenefits)
    setIsAdding(false)
    setFormData({
      benefit: '',
      otherBenefit: '',
    })
    await saveBenefits(newBenefits)
  }

  const handleCancel = () => {
    setIsAdding(false)
    setFormData({
      benefit: '',
      otherBenefit: '',
    })
  }

  const saveBenefits = async (newBenefits: Benefit[]) => {
    setIsSaving(true)
    try {
      const result = await updateCandidate(candidate.id, {
        preferredBenefits: newBenefits,
      } as any)

      if (result.success) {
        onUpdate(result.candidate || {})
        toast.success(t('jobBenefitsUpdated'))
      } else {
        toast.error(result.error || tCommon('failedToUpdate'))
        setBenefits((candidate as any).preferredBenefits || [])
      }
    } catch (error) {
      toast.error(tCommon('anErrorOccurred'))
      setBenefits((candidate as any).preferredBenefits || [])
    } finally {
      setIsSaving(false)
    }
  }

  const getBenefitLabel = (benefit: Benefit) => {
    if (benefit.benefit === 'other') {
      return benefit.otherBenefit || t('other')
    }
    const idx = BENEFIT_VALUES.indexOf(benefit.benefit as typeof BENEFIT_VALUES[number])
    return idx >= 0 ? t(BENEFIT_OPTION_KEYS[idx]) : benefit.benefit
  }

  return (
    <Card className="rounded-xl bg-white p-4 shadow-sm sm:rounded-2xl sm:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between sm:mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-[#282828] sm:size-6" />
          <h3 className="text-base font-semibold text-[#282828] sm:text-lg">{t('title')}</h3>
        </div>
        {!isAdding && (
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

      {/* Add Form */}
      {isAdding && (
        <div className="mb-4 space-y-3 rounded-lg border border-[#ededed] bg-[#fafafa] p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-[#282828]">
              {t('benefit')} <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.benefit}
              onValueChange={(value) => setFormData({ ...formData, benefit: value, otherBenefit: value !== 'other' ? '' : formData.otherBenefit })}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder={t('selectBenefit')} />
              </SelectTrigger>
              <SelectContent>
                {BENEFIT_VALUES.map((value, idx) => (
                  <SelectItem key={value} value={value}>
                    {t(BENEFIT_OPTION_KEYS[idx])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {formData.benefit === 'other' && (
            <div>
              <label className="mb-1 block text-xs font-medium text-[#282828]">
                {t('specifyBenefit')} <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.otherBenefit}
                onChange={(e) => setFormData({ ...formData, otherBenefit: e.target.value })}
                placeholder={t('otherBenefitPlaceholder')}
                className="h-9"
              />
            </div>
          )}
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

      {/* Benefits List */}
      {benefits.length > 0 ? (
        <div className="space-y-2">
          {benefits.map((benefit, index) => (
            <div
              key={benefit.id || index}
              className="flex items-center justify-between rounded-lg border border-[#ededed] bg-white p-3 transition-colors hover:border-[#4644b8]/30"
            >
              <span className="text-sm font-medium text-[#282828]">{getBenefitLabel(benefit)}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(index)}
                className="h-8 w-8 text-red-500 hover:bg-red-50"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : !isAdding && (
        <div className="flex min-h-[120px] flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-[#ededed] p-4">
          <p className="text-sm font-medium text-[#757575]">{t('noBenefitsAddedYet')}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAdd}
            className="border-[#4644b8] text-[#4644b8] hover:bg-[#4644b8] hover:text-white"
          >
            <Plus className="mr-2 size-4" />
            {t('addBenefit')}
          </Button>
        </div>
      )}
    </Card>
  )
}
