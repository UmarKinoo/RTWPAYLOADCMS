'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

// Filter categories for display
const FILTER_CATEGORIES = [
  { id: 'job-market', label: 'Job Market' },
  { id: 'business-performance', label: 'Business Performance' },
  { id: 'culture', label: 'Culture' },
  { id: 'awards', label: 'Awards And List' },
  { id: 'jobs', label: 'Jobs' },
  { id: 'data-resources', label: 'Data Resources' },
  { id: 'interviews', label: 'Interviews' },
]

interface BlogFiltersProps {
  searchValue: string
  onSearchChange: (value: string) => void
  selectedCategories: string[]
  onCategoryToggle: (categoryId: string) => void
}

export const BlogFilters: React.FC<BlogFiltersProps> = ({
  searchValue,
  onSearchChange,
  selectedCategories,
  onCategoryToggle,
}) => {
  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {/* Search Bar */}
      <div className="relative max-w-[600px]">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a2a6a4]" />
        <Input
          type="text"
          placeholder="Search"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn(
            'pl-12 pr-4 py-6 h-[60px] sm:h-[72px]',
            'border border-[#b8bdbb] rounded-2xl sm:rounded-[20px]',
            'text-[16px] sm:text-[18px] font-medium font-poppins',
            'placeholder:text-[#a2a6a4]',
            'focus:ring-2 focus:ring-[#4644b8] focus:border-transparent',
          )}
        />
      </div>

      {/* Category Chips */}
      <div className="flex flex-wrap gap-3 sm:gap-4 md:gap-6 lg:gap-8">
        {FILTER_CATEGORIES.map((category) => {
          const isSelected = selectedCategories.includes(category.id)
          return (
            <button
              key={category.id}
              onClick={() => onCategoryToggle(category.id)}
              className={cn(
                'px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-full',
                'text-[14px] sm:text-[16px] md:text-[18px] lg:text-[20px] font-medium font-inter',
                'transition-colors duration-200',
                isSelected
                  ? 'bg-[#4644b8] text-white'
                  : 'bg-white border border-[#e5eae8] text-[#16252d] hover:bg-gray-50',
              )}
            >
              {category.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}










