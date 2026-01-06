'use client'

import React, { useState } from 'react'
import { useTranslations } from 'next-intl'
import { HomepageSection } from '../homepage/HomepageSection'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ArrowRight, Phone, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'

export const ContactSection: React.FC = () => {
  const t = useTranslations('about.contact')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    title: '',
    message: '',
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
  }

  const inputClasses = cn(
    "w-full bg-white border-0 shadow-sm rounded-xl",
    "h-11 sm:h-12 px-4",
    "text-sm sm:text-base font-medium text-[#16252d]",
    "placeholder:text-[#16252d]/50",
    "focus-visible:ring-2 focus-visible:ring-[#4644b8] focus-visible:ring-offset-0",
    "transition-shadow hover:shadow-md"
  )

  return (
    <HomepageSection className="pb-0">
      {/* Background container */}
      <div className="bg-[#f5f5f5] rounded-t-3xl sm:rounded-t-[40px] md:rounded-t-[50px] -mx-4 sm:-mx-6 md:-mx-8 lg:-mx-12 2xl:-mx-[95px] overflow-hidden">
        {/* Content wrapper */}
        <div className="px-4 sm:px-6 md:px-8 lg:px-12 2xl:px-[95px] py-10 sm:py-12 md:py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12 lg:gap-16">
            {/* Left Side - Contact Info */}
            <div className="flex flex-col">
              <p className="text-base sm:text-lg md:text-xl font-bold text-[#16252d] mb-2">
                {t('label')}
              </p>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold font-inter text-[#16252d] leading-tight mb-4 sm:mb-5">
                {t('title')}
              </h2>
              <p className="text-sm sm:text-base text-[#16252d]/80 leading-relaxed mb-6 sm:mb-8">
                {t('description')}
              </p>

              {/* Contact Details */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                {/* Phone */}
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#4644b8]/10 flex items-center justify-center">
                    <Phone className="w-4 h-4 text-[#4644b8]" />
                  </div>
                  <span className="text-sm sm:text-base font-semibold text-[#16252d]">
                    {t('phone')}
                  </span>
                </div>

                {/* Separator - visible on sm+ */}
                <Separator orientation="vertical" className="hidden sm:block h-6 self-center bg-[#16252d]/20" />

                {/* Email */}
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#4644b8]/10 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-[#4644b8]" />
                  </div>
                  <a
                    href={`mailto:${t('email')}`}
                    className="text-sm sm:text-base font-semibold text-[#16252d] hover:text-[#4644b8] transition-colors"
                  >
                    {t('email')}
                  </a>
                </div>
              </div>
            </div>

            {/* Right Side - Contact Form */}
            <div className="w-full">
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                {/* Name */}
                <Input
                  type="text"
                  name="name"
                  placeholder={t('form.name')}
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className={inputClasses}
                />

                {/* Email and Phone Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    type="email"
                    name="email"
                    placeholder={t('form.email')}
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className={inputClasses}
                  />
                  <Input
                    type="tel"
                    name="phone"
                    placeholder={t('form.phone')}
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className={inputClasses}
                  />
                </div>

                {/* Title */}
                <Input
                  type="text"
                  name="title"
                  placeholder={t('form.title')}
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className={inputClasses}
                />

                {/* Message */}
                <Textarea
                  name="message"
                  placeholder={t('form.message')}
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className={cn(
                    "w-full bg-white border-0 shadow-sm rounded-xl",
                    "min-h-[100px] sm:min-h-[120px] px-4 py-3",
                    "text-sm sm:text-base font-medium text-[#16252d]",
                    "placeholder:text-[#16252d]/50",
                    "focus-visible:ring-2 focus-visible:ring-[#4644b8] focus-visible:ring-offset-0",
                    "transition-shadow hover:shadow-md resize-none"
                  )}
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  className={cn(
                    "w-full bg-[#4644b8] hover:bg-[#3a3aa0]",
                    "text-white rounded-xl h-11 sm:h-12",
                    "text-sm sm:text-base font-bold uppercase",
                    "flex items-center justify-center gap-2",
                    "mt-1 transition-all hover:shadow-lg"
                  )}
                >
                  <span>{t('form.send')}</span>
                  <ArrowRight className="w-4 h-4 -rotate-45" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </HomepageSection>
  )
}
