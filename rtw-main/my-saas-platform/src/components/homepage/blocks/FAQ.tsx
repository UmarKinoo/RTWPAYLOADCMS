'use client'

import React from 'react'
import { Link } from '@/i18n/routing'
import { HomepageSection } from '../HomepageSection'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChevronDown, ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

export const FAQ: React.FC = () => {
  const t = useTranslations('homepage.faq')
  
  const faqItems = [
    {
      question: t('items.verifiedTalent.question'),
      answer: t('items.verifiedTalent.answer'),
    },
    {
      question: t('items.topAgency.question'),
      answer: t('items.topAgency.answer'),
    },
    {
      question: t('items.applyForJobs.question'),
      answer: t('items.applyForJobs.answer'),
    },
    {
      question: t('items.startupsLargeCompanies.question'),
      answer: t('items.startupsLargeCompanies.answer'),
    },
  ]

  return (
    <HomepageSection className="pb-12 sm:pb-16 md:pb-20">
      {/* Background container */}
      <div className="bg-[#f5f5f5] rounded-t-3xl sm:rounded-t-[40px] md:rounded-t-[50px] -mx-4 sm:-mx-6 md:-mx-8 lg:-mx-12 2xl:-mx-[95px]">
        <div className="px-4 sm:px-6 md:px-8 lg:px-12 2xl:px-[95px] py-8 sm:py-10 md:py-12 lg:py-16">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            {/* Left Side - Text and CTA */}
            <div className="flex-1 flex flex-col">
              <div className="mb-6 sm:mb-8">
                {/* FAQ Label */}
                <div className="bg-[#afb7ff] inline-flex px-3 py-1.5 rounded-lg mb-3">
                  <p className="text-xs sm:text-sm font-medium text-white">{t('label')}</p>
                </div>

                {/* Heading */}
                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold font-inter text-[#16252d] leading-tight mb-3">
                  {t('title')}
                </h2>

                {/* Description */}
                <p className="text-sm sm:text-base text-[#16252d]/80 max-w-md">
                  {t('description')}
                </p>
              </div>

              {/* CTA Card */}
              <Card className="bg-[rgba(175,183,255,0.5)] border-0 p-5 sm:p-6 rounded-xl mt-auto">
                <h3 className="text-lg sm:text-xl font-semibold font-inter text-[#16252d] mb-2">
                  {t('gotMoreQuestions')}
                </h3>
                <p className="text-sm text-[#16252d]/80 mb-4">
                  {t('contactUsDescription')}
                </p>
                <Link href="#contact">
                  <Button className="bg-[#4644b8] hover:bg-[#3a3aa0] text-white rounded-xl px-5 py-2.5 text-sm font-medium w-full sm:w-auto flex items-center justify-center gap-2">
                    {t('contactUs')}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </Card>
            </div>

            {/* Right Side - FAQ Accordion */}
            <div className="flex-1">
              <Accordion type="single" collapsible defaultValue="item-1" className="w-full space-y-3">
                {faqItems.map((item, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="border-0">
                    <AccordionTrigger className="bg-white hover:no-underline px-4 sm:px-6 py-4 sm:py-5 rounded-xl data-[state=open]:rounded-b-none data-[state=open]:bg-[rgba(175,183,255,0.5)] [&>svg]:hidden">
                      <p className="text-sm sm:text-base font-medium font-inter text-[#16252d] text-start flex-1 pe-4">
                        {item.question}
                      </p>
                      <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-[#16252d] transition-transform duration-200 flex-shrink-0" />
                    </AccordionTrigger>
                    <AccordionContent className="px-4 sm:px-6 pb-4 pt-0 bg-[rgba(175,183,255,0.5)] rounded-b-xl">
                      <p className="text-sm text-[#636363]">
                        {item.answer}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </div>
      </div>
    </HomepageSection>
  )
}
