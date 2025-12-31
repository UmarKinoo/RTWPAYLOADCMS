'use client'

import React from 'react'
import { HomepageSection } from '../homepage/HomepageSection'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StepCardProps {
  step: number
  title: string
  description: string
}

const StepCard: React.FC<StepCardProps> = ({ step, title, description }) => {
  return (
    <Card className={cn(
      "relative bg-white border border-gray-200 rounded-xl",
      "pt-8 sm:pt-10 pb-4 sm:pb-5",
      "min-h-[120px] sm:min-h-[140px]",
      "shadow-none hover:shadow-lg hover:border-[#4644b8]/20 transition-all duration-300",
      "group"
    )}>
      {/* Step Number Badge */}
      <Badge 
        variant="secondary"
        className={cn(
          "absolute -top-4 sm:-top-5 left-4 sm:left-5",
          "w-8 sm:w-10 h-8 sm:h-10",
          "bg-[#ecf2ff] hover:bg-[#dce8ff] rounded-lg",
          "flex items-center justify-center",
          "text-sm sm:text-base font-semibold text-[#4644b8]",
          "border-0 shadow-sm group-hover:shadow-md transition-shadow"
        )}
      >
        {step}
      </Badge>

      {/* Content */}
      <CardContent className="px-4 sm:px-5 py-0">
        <div className="flex flex-col gap-1.5 sm:gap-2">
          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-[#16252d] leading-tight">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-[#757575] leading-relaxed">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      step: 1,
      title: 'Create account',
      description: 'Sign up in minutes and set up your personal profile to get started.',
    },
    {
      step: 2,
      title: 'Upload CV / Resume',
      description: 'Add your CV and key details so employers can understand your experience and skills.',
    },
    {
      step: 3,
      title: 'Get matched & shortlisted',
      description: 'We match you with relevant employers for interviews.',
    },
    {
      step: 4,
      title: 'Interview & get hired',
      description: "Attend interviews and move forward with the employer that's right for you.",
    },
  ]

  return (
    <HomepageSection className="py-12 sm:py-16 md:py-20">
      {/* Title */}
      <div className="text-center mb-8 sm:mb-10 md:mb-12">
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold font-inter text-[#16252d] leading-tight">
          How it works
        </h2>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-y-10 pt-4 sm:pt-6">
        {steps.map((stepData) => (
          <StepCard key={stepData.step} {...stepData} />
        ))}
      </div>
    </HomepageSection>
  )
}
