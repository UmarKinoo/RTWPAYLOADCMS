'use client'

import { useState } from 'react'
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

const BENEFIT_OPTIONS = [
  { label: 'Health Insurance', value: 'health_insurance' },
  { label: 'Accommodation Provided', value: 'accommodation' },
  { label: 'Transportation Provided', value: 'transportation' },
  { label: 'Annual Leave', value: 'annual_leave' },
  { label: 'End of Service Benefits', value: 'end_of_service' },
  { label: 'Training & Development', value: 'training' },
  { label: 'Performance Bonus', value: 'performance_bonus' },
  { label: 'Overtime Pay', value: 'overtime_pay' },
  { label: 'Meal Allowance', value: 'meal_allowance' },
  { label: 'Other', value: 'other' },
]

export function JobBenefitsSection({ candidate, onUpdate }: JobBenefitsSectionProps) {
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
      toast.error('Please select a benefit')
      return
    }

    if (formData.benefit === 'other' && !formData.otherBenefit) {
      toast.error('Please specify the other benefit')
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
        toast.success('Preferred benefits updated successfully')
      } else {
        toast.error(result.error || 'Failed to update')
        setBenefits((candidate as any).preferredBenefits || [])
      }
    } catch (error) {
      toast.error('An error occurred')
      setBenefits((candidate as any).preferredBenefits || [])
    } finally {
      setIsSaving(false)
    }
  }

  const getBenefitLabel = (benefit: Benefit) => {
    if (benefit.benefit === 'other') {
      return benefit.otherBenefit || 'Other'
    }
    return BENEFIT_OPTIONS.find((opt) => opt.value === benefit.benefit)?.label || benefit.benefit
  }

  return (
    <Card className="rounded-xl bg-white p-4 shadow-sm sm:rounded-2xl sm:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between sm:mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-[#282828] sm:size-6" />
          <h3 className="text-base font-semibold text-[#282828] sm:text-lg">Preferred Job Benefits</h3>
        </div>
        {!isAdding && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleAdd}
            className="h-8 gap-2 border-[#4644b8] text-[#4644b8] hover:bg-[#4644b8] hover:text-white"
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">Add</span>
          </Button>
        )}
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="mb-4 space-y-3 rounded-lg border border-[#ededed] bg-[#fafafa] p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-[#282828]">
              Benefit <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.benefit}
              onValueChange={(value) => setFormData({ ...formData, benefit: value, otherBenefit: value !== 'other' ? '' : formData.otherBenefit })}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select a benefit" />
              </SelectTrigger>
              <SelectContent>
                {BENEFIT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {formData.benefit === 'other' && (
            <div>
              <label className="mb-1 block text-xs font-medium text-[#282828]">
                Specify Benefit <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.otherBenefit}
                onChange={(e) => setFormData({ ...formData, otherBenefit: e.target.value })}
                placeholder="Enter benefit name"
                className="h-9"
              />
            </div>
          )}
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
          <p className="text-sm font-medium text-[#757575]">No benefits added yet</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAdd}
            className="border-[#4644b8] text-[#4644b8] hover:bg-[#4644b8] hover:text-white"
          >
            <Plus className="mr-2 size-4" />
            Add Benefit
          </Button>
        </div>
      )}
    </Card>
  )
}
