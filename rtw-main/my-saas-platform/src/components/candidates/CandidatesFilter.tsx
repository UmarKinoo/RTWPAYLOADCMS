'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Search, SlidersHorizontal, MapPin, Briefcase, User, Clock, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface FilterOption {
  label: string
  value: string
  options: string[]
}

const filterOptions: FilterOption[] = [
  { label: 'Country', value: 'country', options: ['Saudi Arabia', 'UAE', 'Qatar', 'Kuwait'] },
  { label: 'State', value: 'state', options: ['Riyadh', 'Jeddah', 'Makkah', 'Dammam'] },
  { label: 'Job Type', value: 'jobType', options: ['Full-time', 'Part-time', 'Contract'] },
  { label: 'Major Discipline', value: 'majorDiscipline', options: ['Engineering', 'Healthcare', 'Hospitality', 'Construction'] },
  { label: 'Category', value: 'category', options: ['Skilled Workers', 'Specialty', 'Elite', 'Saudi Nationals'] },
  { label: 'Sub Category', value: 'subCategory', options: ['Electrician', 'Plumber', 'Carpenter', 'Mason'] },
  { label: 'Skill Level', value: 'skill', options: ['Beginner', 'Intermediate', 'Advanced', 'Expert'] },
  { label: 'Availability', value: 'availability', options: ['Immediate', '1 Week', '2 Weeks', '1 Month'] },
  { label: 'Nationality', value: 'nationality', options: ['Saudi', 'Indonesian', 'Indian', 'Pakistani', 'Filipino'] },
  { label: 'Experience', value: 'workExperience', options: ['0-1 years', '1-3 years', '3-5 years', '5+ years'] },
  { label: 'Language', value: 'language', options: ['Arabic', 'English', 'Hindi', 'Urdu'] },
]

// Styled Select for Sheet
const FilterSelect: React.FC<{ placeholder: string; options: string[] }> = ({ placeholder, options }) => (
  <Select>
    <SelectTrigger className="h-11 text-sm bg-white border border-gray-200 rounded-xl shadow-sm hover:border-[#4644b8]/30 transition-colors">
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>
      {options.map(opt => (
        <SelectItem key={opt} value={opt.toLowerCase().replace(/\s+/g, '-')}>{opt}</SelectItem>
      ))}
    </SelectContent>
  </Select>
)

// Mobile Filter Sheet
const MobileFilterSheet: React.FC = () => {
  const [activeFilters, setActiveFilters] = useState(0)

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full h-12 rounded-xl",
            "bg-gradient-to-r from-[#4644b8] to-[#6366f1]",
            "border-0 text-white",
            "hover:opacity-90 transition-opacity",
            "flex items-center justify-center gap-2.5",
            "shadow-md shadow-[#4644b8]/20"
          )}
        >
          <SlidersHorizontal className="w-5 h-5" />
          <span className="font-semibold">Filter Candidates</span>
          {activeFilters > 0 && (
            <Badge className="bg-white text-[#4644b8] ml-1">{activeFilters}</Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl px-0">
        {/* Handle bar */}
        <div className="flex justify-center pt-2 pb-3">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <SheetHeader className="px-5 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-bold text-[#16252d]">Filters</SheetTitle>
            <Button variant="ghost" size="sm" className="text-[#4644b8] font-medium hover:bg-[#4644b8]/10">
              Clear All
            </Button>
          </div>
        </SheetHeader>
        
        <div className="overflow-y-auto py-4 px-5 max-h-[calc(85vh-160px)]">
          {/* Quick filters as chips */}
          <div className="mb-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Filters</p>
            <div className="flex flex-wrap gap-2">
              {['Full-time', 'Saudi Arabia', 'Immediate', '5+ years', 'English'].map((filter) => (
                <Badge 
                  key={filter}
                  variant="outline" 
                  className="cursor-pointer border-gray-200 bg-gray-50 hover:bg-[#4644b8] hover:text-white hover:border-[#4644b8] px-3.5 py-2 text-sm font-medium transition-all"
                >
                  {filter}
                </Badge>
              ))}
            </div>
          </div>

          {/* Accordion for grouped filters */}
          <Accordion type="multiple" defaultValue={['location', 'job']} className="w-full space-y-2">
            {/* Location */}
            <AccordionItem value="location" className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
              <AccordionTrigger className="px-4 py-3.5 hover:no-underline hover:bg-gray-50 [&[data-state=open]]:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="font-semibold text-[#16252d]">Location</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-2 space-y-3">
                <FilterSelect placeholder="Country" options={filterOptions[0].options} />
                <FilterSelect placeholder="State/City" options={filterOptions[1].options} />
              </AccordionContent>
            </AccordionItem>

            {/* Job Details */}
            <AccordionItem value="job" className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
              <AccordionTrigger className="px-4 py-3.5 hover:no-underline hover:bg-gray-50 [&[data-state=open]]:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="font-semibold text-[#16252d]">Job Details</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-2 space-y-3">
                <FilterSelect placeholder="Job Type" options={filterOptions[2].options} />
                <FilterSelect placeholder="Major Discipline" options={filterOptions[3].options} />
                <FilterSelect placeholder="Category" options={filterOptions[4].options} />
              </AccordionContent>
            </AccordionItem>

            {/* Candidate Profile */}
            <AccordionItem value="candidate" className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
              <AccordionTrigger className="px-4 py-3.5 hover:no-underline hover:bg-gray-50 [&[data-state=open]]:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                    <User className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="font-semibold text-[#16252d]">Candidate Profile</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-2 space-y-3">
                <FilterSelect placeholder="Experience" options={filterOptions[9].options} />
                <FilterSelect placeholder="Skill Level" options={filterOptions[6].options} />
                <FilterSelect placeholder="Nationality" options={filterOptions[8].options} />
                <FilterSelect placeholder="Language" options={filterOptions[10].options} />
              </AccordionContent>
            </AccordionItem>

            {/* Availability */}
            <AccordionItem value="availability" className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
              <AccordionTrigger className="px-4 py-3.5 hover:no-underline hover:bg-gray-50 [&[data-state=open]]:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className="font-semibold text-[#16252d]">Availability</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-2">
                <FilterSelect placeholder="When available" options={filterOptions[7].options} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <SheetFooter className="px-5 py-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex gap-3 w-full">
            <SheetClose asChild>
              <Button variant="outline" className="flex-1 h-12 rounded-xl border-gray-200 font-medium">
                Cancel
              </Button>
            </SheetClose>
            <SheetClose asChild>
              <Button className="flex-1 h-12 bg-[#4644b8] hover:bg-[#3a3aa0] text-white rounded-xl font-semibold shadow-md shadow-[#4644b8]/20">
                <Search className="w-4 h-4 mr-2" />
                Apply Filters
              </Button>
            </SheetClose>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// Main Filter Component
export const CandidatesFilter: React.FC = () => {
  return (
    <>
      {/* Mobile: Filter Button that opens Sheet */}
      <div className="lg:hidden">
        <MobileFilterSheet />
      </div>

      {/* Desktop: Full Sidebar */}
      <div className="hidden lg:block bg-gradient-to-b from-[#f0f0f0] to-[#e8e7e7] rounded-2xl p-5 w-full shadow-sm">
        {/* Search by Filter Button */}
        <Button
          variant="default"
          className={cn(
            "w-full bg-gradient-to-r from-[#12b98e] to-[#10a882]",
            "hover:opacity-90 transition-opacity",
            "text-white rounded-xl",
            "h-12",
            "text-base font-semibold",
            "flex items-center justify-center gap-2 mb-5",
            "shadow-md shadow-[#12b98e]/20"
          )}
        >
          <Search className="w-5 h-5" />
          <span>Search by Filter</span>
        </Button>

        {/* Filter Dropdowns */}
        <div className="space-y-2.5">
          {filterOptions.map((filter) => (
            <Select key={filter.value}>
              <SelectTrigger 
                className={cn(
                  "w-full bg-white border-0 rounded-xl",
                  "h-12 px-4 text-sm",
                  "font-medium text-[#16252d]",
                  "shadow-sm hover:shadow-md transition-shadow",
                  "focus:ring-2 focus:ring-[#4644b8]"
                )}
              >
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent>
                {filter.options.map((option) => (
                  <SelectItem key={option} value={option.toLowerCase().replace(/\s+/g, '-')}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
        </div>
      </div>
    </>
  )
}
