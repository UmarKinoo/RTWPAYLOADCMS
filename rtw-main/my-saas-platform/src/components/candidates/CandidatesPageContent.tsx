'use client'

import React from 'react'
import { HomepageSection } from '../homepage/HomepageSection'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const sectionClass = 'space-y-4'
const heading2Class =
  'text-2xl sm:text-3xl md:text-4xl font-bold font-inter text-[#16252d] leading-tight'
const heading3Class =
  'text-xl sm:text-2xl font-bold font-inter text-[#16252d] leading-tight mt-6 sm:mt-8 first:mt-0'
const bodyClass =
  'text-sm sm:text-base text-[#16252d]/85 leading-relaxed font-normal'
const listClass = 'space-y-2 mt-3'
const listItemClass = 'flex items-start gap-2 text-sm sm:text-base text-[#16252d]/85 leading-relaxed'

export const CandidatesPageContent: React.FC = () => {
  return (
    <HomepageSection className="py-12 sm:py-16 md:py-20 lg:py-24 bg-[#fafafa]">
      <div className="max-w-4xl mx-auto">
        {/* Intro block */}
        <div className={sectionClass}>
          <h2 className={heading2Class}>
            Connecting Candidates with Top Opportunities
          </h2>
          <p className={cn(bodyClass, 'text-lg sm:text-xl text-[#4644b8] font-medium')}>
            A smarter way to connect with top employers across Saudi Arabia.
          </p>
          <p className={bodyClass}>
            When looking for the right job in Saudi Arabia, it shouldn&apos;t be a separate kind of
            labour work in addition to your job. Ready to Work is designed to make it swift, simple,
            and easy. With clear information at every step and connection to the top organizations,
            you can rock your life.
          </p>
          <p className={bodyClass}>
            This modern job platform connects both job seekers and companies to build a strong
            workforce in Saudi Arabia. The goals of our platform are solely to make job hunting and
            candidate hunting smarter by focusing on relevance and career growth that lasts longer.
          </p>
        </div>

        <Separator className="my-8 sm:my-10 bg-[#e5e5e5]" />

        {/* Opportunities for Expatriates */}
        <div className={sectionClass}>
          <h3 className={heading3Class}>
            Opportunities for Expatriates and Local Talent
          </h3>
          <p className={bodyClass}>
            More and more professionals from various fields are seeking jobs abroad, and Saudi
            Arabia is one of the finest destinations. Ready To Work is here to help foreign workers
            find jobs in the country by ensuring verified job listings and employers. So, we are
            working while considering the global hopes and standards.
          </p>
          <p className={bodyClass}>
            So whether you&apos;re in the list of expatriate jobs in Saudi Arabia in engineering,
            healthcare, construction, IT, or administration, you&apos;ll find relevant openings.
            Every job you see listed by Saudi companies is checked for authenticity and relevance.
          </p>
          <p className={bodyClass}>
            This way, candidates can avoid outdated listings and focus on positions that are
            actively hiring.
          </p>
        </div>

        <Separator className="my-8 sm:my-10 bg-[#e5e5e5]" />

        {/* Digital Platform */}
        <Card className="border-0 shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <h3 className={heading3Class}>
              A Digital Platform Built Around Job Seekers
            </h3>
            <p className={bodyClass}>
              How does our platform benefit the candidates? Here are a few to consider for
              expatriate jobs in Saudi Arabia:
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className={listClass}>
              <li className={listItemClass}>
                <CheckCircle2 className="w-5 h-5 shrink-0 text-[#4644b8] mt-0.5" />
                <span>
                  A centralised Saudi Arabia job portal for verified vacancies in saudi arabia
                  company
                </span>
              </li>
              <li className={listItemClass}>
                <CheckCircle2 className="w-5 h-5 shrink-0 text-[#4644b8] mt-0.5" />
                <span>Quick access to current job openings from local companies</span>
              </li>
              <li className={listItemClass}>
                <CheckCircle2 className="w-5 h-5 shrink-0 text-[#4644b8] mt-0.5" />
                <span>Streamlined application processes that are faster and simpler</span>
              </li>
              <li className={listItemClass}>
                <CheckCircle2 className="w-5 h-5 shrink-0 text-[#4644b8] mt-0.5" />
                <span>
                  This system supports both local talent looking to advance their careers and
                  professionals seeking jobs in Saudi Arabia from abroad.
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <div className={sectionClass + ' mt-8'}>
          <h3 className={heading3Class}>
            How Ready To Work Supports Your Career Journey
          </h3>
          <p className={bodyClass}>
            Ready To Work isn&apos;t your typical job board. It is a modern system that works on
            making real connections. The platform stays updated on hiring trends, market demands,
            and candidate expectations.
          </p>
          <p className={bodyClass}>
            Candidates benefit from the digital platform for job hunting in the following ways:
          </p>
          <ul className={listClass}>
            <li className={listItemClass}>
              <CheckCircle2 className="w-5 h-5 shrink-0 text-[#4644b8] mt-0.5" />
              <span>Getting noticed by employers who are actively hiring in KSA.</span>
            </li>
            <li className={listItemClass}>
              <CheckCircle2 className="w-5 h-5 shrink-0 text-[#4644b8] mt-0.5" />
              <span>A dependable job search in KSA without all the distractions.</span>
            </li>
            <li className={listItemClass}>
              <CheckCircle2 className="w-5 h-5 shrink-0 text-[#4644b8] mt-0.5" />
              <span>
                This platform is designed to assist expatriates in Saudi Arabia at every step of
                their job journey.
              </span>
            </li>
          </ul>
        </div>

        <Separator className="my-8 sm:my-10 bg-[#e5e5e5]" />

        {/* Closing CTA block */}
        <Card className="border-0 shadow-sm bg-[#ecf2ff] rounded-2xl overflow-hidden border border-[#4644b8]/10">
          <CardHeader className="pb-2">
            <h3 className={heading3Class}>
              More Than Jobs - Best Job Advertising Portal in Saudi Arabia
            </h3>
          </CardHeader>
          <CardContent className="pt-0">
            <p className={bodyClass}>
              Ready To Work is more than just job listings; it&apos;s about building careers. By
              linking professionals with trusted employers and relevant roles, the platform helps
              candidates confidently navigate one of the fastest-growing job markets globally. This
              is where readiness for expatriate jobs in Saudi Arabia meets opportunity, and
              it&apos;s where your next job in Saudi Arabia starts.
            </p>
          </CardContent>
        </Card>
      </div>
    </HomepageSection>
  )
}
