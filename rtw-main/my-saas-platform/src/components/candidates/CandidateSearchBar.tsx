'use client'

import React, { useState, FormEvent } from 'react'
import { useRouter } from '@/i18n/routing'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CandidateSearchBarProps {
  initialValue?: string
  className?: string
}

export function CandidateSearchBar({ initialValue = '', className }: CandidateSearchBarProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState(initialValue)

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const trimmedQuery = searchQuery.trim()
    if (trimmedQuery) {
      router.push(`/candidates?search=${encodeURIComponent(trimmedQuery)}`)
    } else {
      router.push('/candidates')
    }
  }

  return (
    <div className={cn('w-full', className)}>
      <form onSubmit={handleSubmit} className="w-full">
        <div className="relative flex items-center w-full max-w-4xl mx-auto">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidates by skills, job title, or keywords... (e.g., 'fix pipes', 'plumber', 'electrician')"
              className={cn(
                'w-full h-14 sm:h-16 pl-12 pr-32 sm:pr-36',
                'text-base sm:text-lg',
                'bg-white border-2 border-gray-200 rounded-2xl',
                'shadow-lg shadow-gray-200/50',
                'focus-visible:border-[#4644b8] focus-visible:ring-[#4644b8]/20 focus-visible:ring-4',
                'placeholder:text-gray-400',
                'transition-all duration-200'
              )}
            />
          </div>

          {/* Search Button */}
          <Button
            type="submit"
            className={cn(
              'absolute right-2 h-10 sm:h-12 px-6 sm:px-8',
              'bg-gradient-to-r from-[#4644b8] to-[#6366f1]',
              'hover:from-[#3a3aa0] hover:to-[#5555d9]',
              'text-white font-semibold rounded-xl',
              'shadow-md hover:shadow-lg',
              'transition-all duration-200',
              'flex items-center gap-2'
            )}
          >
            <Search className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Search</span>
          </Button>
        </div>

        {/* Quick Search Suggestions */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm text-gray-600">
          <span className="text-gray-500">Try:</span>
          {['fix pipes', 'plumber', 'electrician', 'cook', 'babysitter'].map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                setSearchQuery(suggestion)
                router.push(`/candidates?search=${encodeURIComponent(suggestion)}`)
              }}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700 hover:text-[#4644b8]"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </form>
    </div>
  )
}
