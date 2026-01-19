'use client'

import React, { useState } from 'react'
import { HomepageSection } from '../homepage/HomepageSection'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ImageWithSkeleton } from '../homepage/ImageWithSkeleton'
import { ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { submitContactForm } from '@/lib/contact'

// Image assets
const imgBusinessPeople = '/assets/9f9a0a6457907fb5c9adf46ffc89ddfff835e33d.png'
const imgBusinessPeopleMask = '/assets/9067d496e1f10f37d480e3dc99e0dd3a6af0fb6c.svg'

export const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    title: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  } | null>(null)

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setIsSubmitting(true)
    setStatus(null)

    try {
      const result = await submitContactForm(formData)
      
      if (result.success) {
        setStatus({
          type: 'success',
          message: result.message || 'Thank you for your message! We\'ll get back to you soon.',
        })
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          title: '',
          message: '',
        })
        // Clear success message after 8 seconds
        setTimeout(() => {
          setStatus(null)
        }, 8000)
      } else {
        setStatus({
          type: 'error',
          message: result.error || 'Failed to submit form. Please try again.',
        })
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'An unexpected error occurred. Please try again later.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClasses = cn(
    "w-full bg-[#f5f5f5] border-0 rounded-[15px]",
    "h-[70px] px-5",
    "text-base font-medium text-[#16252d]",
    "placeholder:text-[#16252d]/50",
    "focus-visible:ring-2 focus-visible:ring-[#4644b8] focus-visible:ring-offset-0",
    "transition-all"
  )

  return (
    <HomepageSection className="py-10 sm:py-12 md:py-16 lg:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-start">
        {/* Left Side - Image */}
        <div className="order-2 lg:order-1 w-full">
          <div className="relative w-full aspect-[4/3] lg:aspect-square rounded-2xl overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                maskImage: `url('${imgBusinessPeopleMask}')`,
                WebkitMaskImage: `url('${imgBusinessPeopleMask}')`,
                maskSize: 'contain',
                maskPosition: 'center',
                maskRepeat: 'no-repeat',
              }}
            >
              <ImageWithSkeleton
                src={imgBusinessPeople}
                alt="Successful business people in modern office"
                fill
                objectFit="cover"
                objectPosition="center"
              />
            </div>
          </div>
        </div>

        {/* Right Side - Contact Form */}
        <div className="order-1 lg:order-2 w-full">
          {/* Status Message */}
          {status && (
            <div
              className={`mb-4 flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
                status.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {status.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span>{status.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Name */}
            <Input
              type="text"
              name="name"
              placeholder="Your Name*"
              value={formData.name}
              onChange={handleInputChange}
              required
              disabled={isSubmitting}
              className={inputClasses}
            />

            {/* Email and Phone Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                type="email"
                name="email"
                placeholder="Email*"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={isSubmitting}
                className={inputClasses}
              />
              <Input
                type="tel"
                name="phone"
                placeholder="Phone*"
                value={formData.phone}
                onChange={handleInputChange}
                required
                disabled={isSubmitting}
                className={inputClasses}
              />
            </div>

            {/* Title */}
            <Input
              type="text"
              name="title"
              placeholder="Your Title*"
              value={formData.title}
              onChange={handleInputChange}
              required
              disabled={isSubmitting}
              className={inputClasses}
            />

            {/* Message */}
            <Textarea
              name="message"
              placeholder="Message*"
              value={formData.message}
              onChange={handleInputChange}
              required
              disabled={isSubmitting}
              rows={5}
              className={cn(
                "w-full bg-[#f5f5f5] border-0 rounded-[15px]",
                "min-h-[200px] px-5 py-4",
                "text-base font-medium text-[#16252d]",
                "placeholder:text-[#16252d]/50",
                "focus-visible:ring-2 focus-visible:ring-[#4644b8] focus-visible:ring-offset-0",
                "transition-all resize-none",
                isSubmitting && "opacity-50 cursor-not-allowed"
              )}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "w-full bg-[#4644b8] hover:bg-[#3a3aa0]",
                "text-white rounded-[15px] h-[78px]",
                "text-base font-bold uppercase",
                "flex items-center justify-center gap-2",
                "transition-all hover:shadow-lg",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>SENDING...</span>
                </>
              ) : (
                <>
                  <span>SEND</span>
                  <ArrowRight className="w-5 h-5 rotate-90" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </HomepageSection>
  )
}

