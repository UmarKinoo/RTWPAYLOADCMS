'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
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
  date: z.date({ message: 'Date is required' }).optional(),
  time: z.string().min(1, 'Time is required'),
  jobPosition: z.string().min(1, 'Job position is required'),
  jobLocation: z.string().min(1, 'Job location is required'),
  salary: z.string().min(1, 'Salary is required'),
  accommodationIncluded: z.enum(['yes', 'no'], {
    message: 'Please select an option',
  }),
  transportation: z.enum(['yes', 'no'], {
    message: 'Please select an option',
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
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<InterviewRequestFormData>({
    resolver: zodResolver(interviewRequestSchema),
    defaultValues: {
      date: undefined,
      time: '',
      jobPosition: '',
      jobLocation: '',
      salary: '',
      accommodationIncluded: undefined,
      transportation: undefined,
    },
  })

  const onSubmit = async (data: InterviewRequestFormData) => {
    if (!data.date) {
      onError?.('Please select a date')
      return
    }

    setIsSubmitting(true)

    try {
      const [hours, minutes] = data.time.split(':')
      const scheduledDate = new Date(data.date)
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Date and Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-[#16252d]">
                  Date *
                </FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full h-11 justify-start text-left font-normal bg-white border-[#d9d9d9] rounded-lg hover:bg-[#fafafa] hover:border-[#4644b8]/40',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                        {field.value ? format(field.value, 'MMM d, yyyy') : 'Pick date'}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-lg border-[#e5e5e5] shadow-lg" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-[#16252d]">
                  Time *
                </FormLabel>
                <FormControl>
                  <Input
                    type="time"
                    className="h-11 bg-white border-[#d9d9d9] rounded-lg text-sm focus-visible:ring-[#4644b8] focus-visible:border-[#4644b8]"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </div>

        {/* Role & location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="jobPosition"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-[#16252d]">
                  Job position offered *
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 bg-white border-[#d9d9d9] rounded-lg focus:ring-[#4644b8]">
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-lg border-[#e5e5e5]">
                    <SelectItem value="barista">Barista</SelectItem>
                    <SelectItem value="waiter">Waiter</SelectItem>
                    <SelectItem value="chef">Chef</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="cashier">Cashier</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="jobLocation"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-[#16252d]">
                  Job location *
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 bg-white border-[#d9d9d9] rounded-lg focus:ring-[#4644b8]">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-lg border-[#e5e5e5]">
                    <SelectItem value="riyadh">Riyadh</SelectItem>
                    <SelectItem value="jeddah">Jeddah</SelectItem>
                    <SelectItem value="dammam">Dammam</SelectItem>
                    <SelectItem value="khobar">Khobar</SelectItem>
                    <SelectItem value="mecca">Mecca</SelectItem>
                    <SelectItem value="medina">Medina</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </div>

        {/* Salary */}
        <FormField
          control={form.control}
          name="salary"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-[#16252d]">
                Salary offered *
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. 3,000 SAR"
                  className="h-11 bg-white border-[#d9d9d9] rounded-lg placeholder:text-muted-foreground focus-visible:ring-[#4644b8]"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        {/* Accommodation & Transportation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="accommodationIncluded"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-sm font-medium text-[#16252d]">
                  Accommodation included *
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex gap-4"
                  >
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <RadioGroupItem value="yes" id="accommodation-yes" className="border-[#d9d9d9]" />
                      <span className="text-sm text-[#16252d]">Yes</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <RadioGroupItem value="no" id="accommodation-no" className="border-[#d9d9d9]" />
                      <span className="text-sm text-[#16252d]">No</span>
                    </label>
                  </RadioGroup>
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="transportation"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-sm font-medium text-[#16252d]">
                  Transportation *
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex gap-4"
                  >
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <RadioGroupItem value="yes" id="transportation-yes" className="border-[#d9d9d9]" />
                      <span className="text-sm text-[#16252d]">Yes</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <RadioGroupItem value="no" id="transportation-no" className="border-[#d9d9d9]" />
                      <span className="text-sm text-[#16252d]">No</span>
                    </label>
                  </RadioGroup>
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 bg-[#4644b8] hover:bg-[#3a3aa0] text-white rounded-lg text-sm font-semibold cursor-pointer"
        >
          {isSubmitting ? 'Sending…' : 'Send invitation'}
        </Button>
      </form>
    </Form>
  )
}

