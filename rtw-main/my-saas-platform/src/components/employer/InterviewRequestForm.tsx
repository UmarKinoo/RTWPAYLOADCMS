'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { requestInterview } from '@/lib/employer/interviews'
import { useRouter } from 'next/navigation'

const interviewRequestSchema = z.object({
  date: z.date({
    required_error: 'Date is required',
  }),
  time: z.string().min(1, 'Time is required'),
  jobPosition: z.string().min(1, 'Job position is required'),
  jobLocation: z.string().min(1, 'Job location is required'),
  salary: z.string().min(1, 'Salary is required'),
  accommodationIncluded: z.enum(['yes', 'no'], {
    required_error: 'Please select an option',
  }),
  transportation: z.enum(['yes', 'no'], {
    required_error: 'Please select an option',
  }),
})

type InterviewRequestFormData = z.infer<typeof interviewRequestSchema>

interface InterviewRequestFormProps {
  candidateId: number
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function InterviewRequestForm({
  candidateId,
  onSuccess,
  onError,
}: InterviewRequestFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [date, setDate] = useState<Date>()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<InterviewRequestFormData>({
    resolver: zodResolver(interviewRequestSchema),
    defaultValues: {
      accommodationIncluded: undefined,
      transportation: undefined,
    },
  })

  // Sync date state with form
  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    if (selectedDate) {
      setValue('date', selectedDate, { shouldValidate: true })
    }
  }

  const accommodationValue = watch('accommodationIncluded')
  const transportationValue = watch('transportation')

  const formatTime = (timeString: string): string => {
    // Convert 24h format to 12h format if needed
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours, 10)
    const ampm = hour >= 12 ? 'pm' : 'am'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes}${ampm}`
  }

  const onSubmit = async (data: InterviewRequestFormData) => {
    if (!date) {
      onError?.('Please select a date')
      return
    }

    setIsSubmitting(true)

    try {
      // Combine date and time
      const [hours, minutes] = data.time.split(':')
      const scheduledDate = new Date(date)
      scheduledDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0)

      const result = await requestInterview({
        candidateId,
        scheduledAt: scheduledDate.toISOString(),
        jobPosition: data.jobPosition,
        jobLocation: data.jobLocation,
        salary: data.salary,
        accommodationIncluded: data.accommodationIncluded === 'yes',
        transportation: data.transportation === 'yes',
      })

      if (result.success) {
        onSuccess?.()
        router.refresh()
      } else {
        onError?.(result.error || 'Failed to send invitation')
      }
    } catch (error: any) {
      onError?.(error.message || 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Date and Time Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Date */}
        <div className="space-y-2">
          <Label
            htmlFor="date"
            className="text-base font-semibold text-[#141514] tracking-[0.48px] capitalize"
          >
            Date
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full h-14 justify-start text-left font-medium bg-white border-[#1b3227] rounded-[4px]',
                  !date && 'text-[#b8bdbb]'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, 'MM/dd/yyyy') : '02/02/1994'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {errors.date && (
            <p className="text-sm text-red-500">{errors.date.message}</p>
          )}
        </div>

        {/* Time */}
        <div className="space-y-2">
          <Label
            htmlFor="time"
            className="text-base font-semibold text-[#141514] tracking-[0.48px] capitalize"
          >
            Time
          </Label>
          <Input
            id="time"
            type="time"
            className="h-14 bg-white border-[#1b3227] rounded-[4px] text-sm font-medium"
            {...register('time')}
          />
          {errors.time && (
            <p className="text-sm text-red-500">{errors.time.message}</p>
          )}
        </div>
      </div>

      {/* Job Position */}
      <div className="space-y-2">
        <Label
          htmlFor="jobPosition"
          className="text-base font-semibold text-[#141514] tracking-[0.48px] capitalize"
        >
          Job position offered*
        </Label>
        <Select
          onValueChange={(value) => {
            setValue('jobPosition', value, { shouldValidate: true })
          }}
        >
          <SelectTrigger className="h-14 bg-white border-[#cfd4d1] rounded-[4px]">
            <SelectValue placeholder="Select Position" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="barista">Barista</SelectItem>
            <SelectItem value="waiter">Waiter</SelectItem>
            <SelectItem value="chef">Chef</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="cashier">Cashier</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        {errors.jobPosition && (
          <p className="text-sm text-red-500">{errors.jobPosition.message}</p>
        )}
      </div>

      {/* Job Location */}
      <div className="space-y-2">
        <Label
          htmlFor="jobLocation"
          className="text-base font-semibold text-[#141514] tracking-[0.48px] capitalize"
        >
          Job location*
        </Label>
        <Select
          onValueChange={(value) => {
            setValue('jobLocation', value, { shouldValidate: true })
          }}
        >
          <SelectTrigger className="h-14 bg-white border-[#cfd4d1] rounded-[4px]">
            <SelectValue placeholder="Select your location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="riyadh">Riyadh</SelectItem>
            <SelectItem value="jeddah">Jeddah</SelectItem>
            <SelectItem value="dammam">Dammam</SelectItem>
            <SelectItem value="khobar">Khobar</SelectItem>
            <SelectItem value="mecca">Mecca</SelectItem>
            <SelectItem value="medina">Medina</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        {errors.jobLocation && (
          <p className="text-sm text-red-500">{errors.jobLocation.message}</p>
        )}
      </div>

      {/* Salary */}
      <div className="space-y-2">
        <Label
          htmlFor="salary"
          className="text-base font-semibold text-[#141514] tracking-[0.48px] capitalize"
        >
          Salary*
        </Label>
        <Input
          id="salary"
          placeholder="SAR 000"
          className="h-14 bg-white border-[#cfd4d1] rounded-[4px] text-sm font-medium placeholder:text-[#b8bdbb]"
          {...register('salary')}
        />
        {errors.salary && (
          <p className="text-sm text-red-500">{errors.salary.message}</p>
        )}
      </div>

      {/* Accommodation Included */}
      <div className="space-y-2">
        <Label className="text-base font-semibold text-[#141514] tracking-[0.48px] capitalize">
          Accommodation included
        </Label>
        <RadioGroup
          value={accommodationValue}
          onValueChange={(value) =>
            setValue('accommodationIncluded', value as 'yes' | 'no', {
              shouldValidate: true,
            })
          }
          className="flex gap-6"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="yes" id="accommodation-yes" />
            <Label
              htmlFor="accommodation-yes"
              className="text-base font-normal text-[#141514] tracking-[0.48px] capitalize cursor-pointer"
            >
              Yes
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="no" id="accommodation-no" />
            <Label
              htmlFor="accommodation-no"
              className="text-base font-normal text-[#141514] tracking-[0.48px] capitalize cursor-pointer"
            >
              No
            </Label>
          </div>
        </RadioGroup>
        {errors.accommodationIncluded && (
          <p className="text-sm text-red-500">
            {errors.accommodationIncluded.message}
          </p>
        )}
      </div>

      {/* Transportation */}
      <div className="space-y-2">
        <Label className="text-base font-semibold text-[#141514] tracking-[0.48px] capitalize">
          Transportation
        </Label>
        <RadioGroup
          value={transportationValue}
          onValueChange={(value) =>
            setValue('transportation', value as 'yes' | 'no', {
              shouldValidate: true,
            })
          }
          className="flex gap-6"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="yes" id="transportation-yes" />
            <Label
              htmlFor="transportation-yes"
              className="text-base font-normal text-[#141514] tracking-[0.48px] capitalize cursor-pointer"
            >
              Yes
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="no" id="transportation-no" />
            <Label
              htmlFor="transportation-no"
              className="text-base font-normal text-[#141514] tracking-[0.48px] capitalize cursor-pointer"
            >
              No
            </Label>
          </div>
        </RadioGroup>
        {errors.transportation && (
          <p className="text-sm text-red-500">{errors.transportation.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-12 bg-[#4644b8] hover:bg-[#3a3aa0] text-white rounded-[10px] text-base font-semibold"
      >
        {isSubmitting ? 'Sending...' : 'Sent Invitation'}
      </Button>
    </form>
  )
}

