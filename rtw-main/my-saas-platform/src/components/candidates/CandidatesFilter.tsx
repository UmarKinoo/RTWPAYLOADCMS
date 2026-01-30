'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from '@/i18n/routing'
import { useLocale, useTranslations } from 'next-intl'
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
import { Search, SlidersHorizontal, MapPin, Briefcase, User, Clock, X, Award, Globe, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { getFilterOptions as fetchFilterOptions } from '@/lib/candidates/filter-options'

// Filter configuration - maps to URL params and database fields
interface FilterConfig {
  label: string
  param: string
  options: string[]
}

// Param to translation key for filter labels (so filters display in current locale)
const paramToLabelKey: Record<string, string> = {
  country: 'country',
  state: 'stateCity',
  jobType: 'jobType',
  discipline: 'majorDiscipline',
  category: 'category',
  subCategory: 'subCategory',
  skillLevel: 'skillLevel',
  availability: 'whenAvailable',
  nationality: 'nationality',
  experience: 'experience',
  language: 'language',
}

// Base filter configuration
const baseFilterConfigs: FilterConfig[] = [
  { label: 'Country', param: 'country', options: [] },
  { label: 'State', param: 'state', options: [] },
  { label: 'Job Type', param: 'jobType', options: ['Full-time', 'Part-time', 'Contract'] },
  { label: 'Major Discipline', param: 'discipline', options: [] },
  { label: 'Category', param: 'category', options: [] },
  { label: 'Sub Category', param: 'subCategory', options: [] },
  { label: 'Skill Level', param: 'skillLevel', options: ['Beginner', 'Intermediate', 'Advanced', 'Expert'] },
  { label: 'Availability', param: 'availability', options: ['Immediate', '1 Week', '2 Weeks', '1 Month', '2+ Months'] },
  { label: 'Nationality', param: 'nationality', options: [] },
  { label: 'Experience', param: 'experience', options: ['0-1 years', '1-3 years', '3-5 years', '5-10 years', '10+ years'] },
  { label: 'Language', param: 'language', options: [] },
]

// Styled Select Component with label always visible
const FilterSelect: React.FC<{
  label: string
  value?: string
  options: string[]
  isLoading?: boolean
  onValueChange: (value: string) => void
  t?: ReturnType<typeof useTranslations<'candidatesPage.filters'>>
  /** Optional: map option value -> display label (e.g. localized discipline name) */
  getOptionLabel?: (value: string) => string
}> = ({ label, value, options, isLoading = false, onValueChange, t, getOptionLabel }) => {
  const handleValueChange = (newValue: string) => {
    // Convert "__all__" to empty string to clear the filter
    if (newValue === '__all__') {
      onValueChange('')
    } else {
      onValueChange(newValue)
    }
  }

  // Determine if we have a valid value
  const hasValue = value && value !== '__all__' && value !== ''

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-[#16252d]">
        {label}
      </Label>
      <Select 
        value={hasValue ? value : undefined} 
        onValueChange={handleValueChange}
        disabled={isLoading}
      >
        <SelectTrigger 
          className={cn(
            "h-11 w-full bg-white border rounded-xl shadow-sm transition-colors px-4 text-sm justify-between",
            hasValue 
              ? "border-[#4644b8] text-[#16252d]" 
              : "border-gray-200 hover:border-[#4644b8]/30 text-gray-500",
            isLoading && "opacity-50 cursor-not-allowed"
          )}
        >
          <SelectValue placeholder={isLoading ? (t?.('loading') || 'Loading...') : (t ? t('selectLabel', { label: label.toLowerCase() }) : `Select ${label.toLowerCase()}`)} />
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400 ml-2" />
          )}
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          <SelectItem value="__all__">{t?.('all') || 'All'}</SelectItem>
          {isLoading ? (
            <SelectItem value="__loading__" disabled>
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t?.('loadingOptions') || 'Loading options...'}</span>
              </div>
            </SelectItem>
          ) : options.length > 0 ? (
            options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {getOptionLabel ? getOptionLabel(opt) : opt}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="__no_options__" disabled>
              {t?.('noOptionsAvailable') || 'No options available'}
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  )
}

// Mobile Filter Sheet
const MobileFilterSheet: React.FC<{
  filters: Record<string, string>
  onFilterChange: (key: string, value: string) => void
  onClearAll: () => void
  filterConfigs: FilterConfig[]
  isLoadingOptions: boolean
  t: ReturnType<typeof useTranslations<'candidatesPage.filters'>>
  labelMaps: { discipline: Record<string, string>; category: Record<string, string>; subCategory: Record<string, string> } | null
}> = ({ filters, onFilterChange, onClearAll, filterConfigs, isLoadingOptions, t, labelMaps }) => {
  const activeFilterCount = Object.values(filters).filter((v) => v).length

  const getFilterOptions = (param: string) => {
    return filterConfigs.find((f) => f.param === param)?.options || []
  }

  const getOptionLabelForParam = (param: string) => {
    if (!labelMaps || (param !== 'discipline' && param !== 'category' && param !== 'subCategory')) return undefined
    return (val: string) => labelMaps[param as keyof typeof labelMaps][val] ?? val
  }

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
          <span className="font-semibold">{t('filterCandidates')}</span>
          {activeFilterCount > 0 && (
            <Badge className="bg-white text-[#4644b8] ml-1">{activeFilterCount}</Badge>
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
            <SheetTitle className="text-xl font-bold text-[#16252d]">{t('filters')}</SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-[#4644b8] font-medium hover:bg-[#4644b8]/10"
              onClick={onClearAll}
            >
              {t('clearAll')}
            </Button>
          </div>
        </SheetHeader>

        <div className="overflow-y-auto py-4 px-5 max-h-[calc(85vh-160px)]">
          {/* Active Filters - At Top */}
          {activeFilterCount > 0 && (
            <div className="mb-5 pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {t('activeFilters')}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#4644b8] font-medium hover:bg-[#4644b8]/10 h-7 px-2 text-xs"
                  onClick={onClearAll}
                >
                  {t('clearAll')}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(filters).map(([key, value]) => {
                  if (!value) return null
                  const config = filterConfigs.find((f) => f.param === key)
                  const displayValue = labelMaps && (key === 'discipline' || key === 'category' || key === 'subCategory')
                    ? (labelMaps[key as keyof typeof labelMaps][value] ?? value)
                    : value
                  return (
                    <Badge
                      key={key}
                      variant="outline"
                      className="cursor-pointer border-[#4644b8] bg-[#4644b8]/10 text-[#4644b8] px-3.5 py-2 text-sm font-medium flex items-center gap-2"
                    >
                      {config ? t(paramToLabelKey[config.param] ?? config.param) : key}: {displayValue}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => onFilterChange(key, '')}
                      />
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}

          {/* Accordion for grouped filters */}
          <Accordion type="multiple" defaultValue={['location', 'job', 'profile', 'availability']} className="w-full space-y-2">
            {/* Location */}
            <AccordionItem value="location" className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
              <AccordionTrigger className="px-4 py-3.5 hover:no-underline hover:bg-gray-50 [&[data-state=open]]:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="font-semibold text-[#16252d]">{t('location')}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-2 space-y-3">
                <FilterSelect
                  label={t('country')}
                  value={filters.country}
                  options={getFilterOptions('country')}
                  isLoading={isLoadingOptions}
                  onValueChange={(value) => onFilterChange('country', value)}
                  t={t}
                />
                <FilterSelect
                  label={t('stateCity')}
                  value={filters.state}
                  options={getFilterOptions('state')}
                  isLoading={isLoadingOptions}
                  onValueChange={(value) => onFilterChange('state', value)}
                  t={t}
                />
              </AccordionContent>
            </AccordionItem>

            {/* Job Details */}
            <AccordionItem value="job" className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
              <AccordionTrigger className="px-4 py-3.5 hover:no-underline hover:bg-gray-50 [&[data-state=open]]:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="font-semibold text-[#16252d]">{t('jobDetails')}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-2 space-y-3">
                <FilterSelect
                  label={t('jobType')}
                  value={filters.jobType}
                  options={getFilterOptions('jobType')}
                  isLoading={false}
                  onValueChange={(value) => onFilterChange('jobType', value)}
                  t={t}
                />
                <FilterSelect
                  label={t('majorDiscipline')}
                  value={filters.discipline}
                  options={getFilterOptions('discipline')}
                  isLoading={isLoadingOptions}
                  onValueChange={(value) => onFilterChange('discipline', value)}
                  t={t}
                />
                <FilterSelect
                  label={t('category')}
                  value={filters.category}
                  options={getFilterOptions('category')}
                  isLoading={isLoadingOptions}
                  onValueChange={(value) => onFilterChange('category', value)}
                  t={t}
                />
                <FilterSelect
                  label={t('subCategory')}
                  value={filters.subCategory}
                  options={getFilterOptions('subCategory')}
                  isLoading={isLoadingOptions}
                  onValueChange={(value) => onFilterChange('subCategory', value)}
                  t={t}
                />
                <FilterSelect
                  label={t('skillLevel')}
                  value={filters.skillLevel}
                  options={getFilterOptions('skillLevel')}
                  isLoading={false}
                  onValueChange={(value) => onFilterChange('skillLevel', value)}
                  t={t}
                />
              </AccordionContent>
            </AccordionItem>

            {/* Candidate Profile */}
            <AccordionItem value="profile" className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
              <AccordionTrigger className="px-4 py-3.5 hover:no-underline hover:bg-gray-50 [&[data-state=open]]:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                    <User className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="font-semibold text-[#16252d]">{t('candidateProfile')}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-2 space-y-3">
                <FilterSelect
                  label={t('nationality')}
                  value={filters.nationality}
                  options={getFilterOptions('nationality')}
                  isLoading={isLoadingOptions}
                  onValueChange={(value) => onFilterChange('nationality', value)}
                  t={t}
                />
                <FilterSelect
                  label={t('experience')}
                  value={filters.experience}
                  options={getFilterOptions('experience')}
                  isLoading={false}
                  onValueChange={(value) => onFilterChange('experience', value)}
                  t={t}
                />
                <FilterSelect
                  label={t('language')}
                  value={filters.language}
                  options={getFilterOptions('language')}
                  isLoading={isLoadingOptions}
                  onValueChange={(value) => onFilterChange('language', value)}
                  t={t}
                />
              </AccordionContent>
            </AccordionItem>

            {/* Availability */}
            <AccordionItem value="availability" className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
              <AccordionTrigger className="px-4 py-3.5 hover:no-underline hover:bg-gray-50 [&[data-state=open]]:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className="font-semibold text-[#16252d]">{t('availability')}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-2">
                <FilterSelect
                  label={t('whenAvailable')}
                  value={filters.availability}
                  options={getFilterOptions('availability')}
                  isLoading={false}
                  onValueChange={(value) => onFilterChange('availability', value)}
                  t={t}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <SheetFooter className="px-5 py-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex gap-3 w-full">
            <SheetClose asChild>
              <Button variant="outline" className="flex-1 h-12 rounded-xl border-gray-200 font-medium">
                {t('cancel')}
              </Button>
            </SheetClose>
            <SheetClose asChild>
              <Button className="flex-1 h-12 bg-[#4644b8] hover:bg-[#3a3aa0] text-white rounded-xl font-semibold shadow-md shadow-[#4644b8]/20">
                <Search className="w-4 h-4 mr-2" />
                {t('applyFilters')}
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
  const router = useRouter()
  const locale = useLocale()
  const searchParams = useSearchParams()
  const t = useTranslations('candidatesPage.filters')
  
  // Initialize all filters from URL params
  const initialFilters: Record<string, string> = {}
  baseFilterConfigs.forEach((config) => {
    initialFilters[config.param] = searchParams.get(config.param) || ''
  })

  const [filters, setFilters] = useState<Record<string, string>>(initialFilters)

  // Update filters when URL changes (e.g., browser back/forward)
  useEffect(() => {
    const newFilters: Record<string, string> = {}
    baseFilterConfigs.forEach((config) => {
      newFilters[config.param] = searchParams.get(config.param) || ''
    })
    setFilters(newFilters)
  }, [searchParams])

  // State for dynamic filter options
  const [filterOptions, setFilterOptions] = useState<Record<string, string[]>>({
    country: [],
    state: [],
    nationality: [],
    language: [],
    discipline: [],
    category: [],
    subCategory: [],
  })

  // Hierarchy maps for cascading discipline -> category -> subCategory
  const [hierarchyMaps, setHierarchyMaps] = useState<{
    categoriesByDiscipline: Record<string, string[]>
    subCategoriesByCategory: Record<string, string[]>
  }>({ categoriesByDiscipline: {}, subCategoriesByCategory: {} })

  // Label maps for localized option display (discipline, category, subCategory)
  const [labelMaps, setLabelMaps] = useState<{
    discipline: Record<string, string>
    category: Record<string, string>
    subCategory: Record<string, string>
  } | null>(null)

  // Loading state for filter options
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)

  // Fetch dynamic filter options using Server Action (pass locale for localized labels)
  useEffect(() => {
    const loadFilterOptions = async () => {
      setIsLoadingOptions(true)
      try {
        const data = await fetchFilterOptions(locale)
        setFilterOptions({
          country: data.countries || [],
          state: data.states || [],
          nationality: data.nationalities || [],
          language: data.languages || [],
          discipline: data.disciplines || [],
          category: data.categories || [],
          subCategory: data.subCategories || [],
        })
        setHierarchyMaps({
          categoriesByDiscipline: data.categoriesByDiscipline ?? {},
          subCategoriesByCategory: data.subCategoriesByCategory ?? {},
        })
        if (data.labelMaps) {
          setLabelMaps(data.labelMaps)
        } else {
          setLabelMaps(null)
        }
      } catch (error) {
        console.error('Failed to fetch filter options:', error)
      } finally {
        setIsLoadingOptions(false)
      }
    }
    loadFilterOptions()
  }, [locale])

  // Build filter configs with dynamic options; category/subCategory cascade from hierarchy
  const filterConfigs = baseFilterConfigs.map((config) => {
    if (config.param === 'category') {
      const opts = hierarchyMaps.categoriesByDiscipline[filters.discipline] ?? []
      return { ...config, options: opts }
    }
    if (config.param === 'subCategory') {
      const opts = hierarchyMaps.subCategoriesByCategory[filters.category] ?? []
      return { ...config, options: opts }
    }
    if (filterOptions[config.param]?.length) {
      return { ...config, options: filterOptions[config.param] }
    }
    return config
  })

  // Update URL params when filters change; clear dependent filters when parent changes
  const updateFilters = useCallback(
    (key: string, value: string) => {
      let newFilters = { ...filters, [key]: value }
      if (key === 'discipline') {
        newFilters = { ...newFilters, category: '', subCategory: '' }
      } else if (key === 'category') {
        newFilters = { ...newFilters, subCategory: '' }
      }
      setFilters(newFilters)

      // Build new URL params
      const params = new URLSearchParams(searchParams.toString())
      params.delete('page')
      Object.entries(newFilters).forEach(([filterKey, filterValue]) => {
        if (filterValue) {
          params.set(filterKey, filterValue)
        } else {
          params.delete(filterKey)
        }
      })

      router.push(`/candidates?${params.toString()}`, { scroll: false })
    },
    [filters, router, searchParams]
  )

  const clearAllFilters = useCallback(() => {
    const clearedFilters: Record<string, string> = {}
    baseFilterConfigs.forEach((config) => {
      clearedFilters[config.param] = ''
    })
    setFilters(clearedFilters)
    router.push('/candidates', { scroll: false })
  }, [router])

  const activeFilterCount = Object.values(filters).filter((v) => v).length

  return (
    <>
      {/* Mobile: Filter Button that opens Sheet */}
      <div className="lg:hidden">
        <MobileFilterSheet
          filters={filters}
          onFilterChange={updateFilters}
          onClearAll={clearAllFilters}
          filterConfigs={filterConfigs}
          isLoadingOptions={isLoadingOptions}
          t={t}
        />
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
          onClick={() => {
            // Trigger search with current filters
            const params = new URLSearchParams(searchParams.toString())
            params.delete('page')
            Object.entries(filters).forEach(([key, value]) => {
              if (value) {
                params.set(key, value)
              } else {
                params.delete(key)
              }
            })
            router.push(`/candidates?${params.toString()}`, { scroll: false })
          }}
        >
          <Search className="w-5 h-5" />
          <span>{t('searchByFilter')}</span>
        </Button>

        {/* Active Filters Display - At Top */}
        {activeFilterCount > 0 && (
          <div className="mb-5 pb-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {t('activeFilters')}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="text-[#4644b8] font-medium hover:bg-[#4644b8]/10 h-7 px-2 text-xs"
                onClick={clearAllFilters}
              >
                {t('clearAll')}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(filters).map(([key, value]) => {
                if (!value) return null
                const config = filterConfigs.find((f) => f.param === key)
                const displayValue = labelMaps && (key === 'discipline' || key === 'category' || key === 'subCategory')
                  ? (labelMaps[key as keyof typeof labelMaps][value] ?? value)
                  : value
                return (
                  <Badge
                    key={key}
                    variant="outline"
                    className="cursor-pointer border-[#4644b8] bg-[#4644b8]/10 text-[#4644b8] px-2.5 py-1 text-xs font-medium flex items-center gap-1.5"
                  >
                    {config ? t(paramToLabelKey[config.param] ?? config.param) : key}: {displayValue}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-[#3a3aa0]"
                      onClick={() => updateFilters(key, '')}
                    />
                  </Badge>
                )
              })}
            </div>
          </div>
        )}

        {/* Filter Dropdowns */}
        <div className="space-y-4">
          {filterConfigs.map((filter) => {
            const needsLoading = ['country', 'state', 'nationality', 'language', 'discipline', 'category', 'subCategory'].includes(filter.param)
            const labelKey = paramToLabelKey[filter.param] ?? filter.param
            const getOptionLabel = labelMaps && (filter.param === 'discipline' || filter.param === 'category' || filter.param === 'subCategory')
              ? (val: string) => labelMaps[filter.param as keyof typeof labelMaps][val] ?? val
              : undefined
            return (
              <FilterSelect
                key={filter.param}
                label={t(labelKey)}
                value={filters[filter.param]}
                options={filter.options}
                isLoading={needsLoading && isLoadingOptions}
                onValueChange={(value) => updateFilters(filter.param, value)}
                t={t}
                getOptionLabel={getOptionLabel}
              />
            )
          })}
        </div>
      </div>
    </>
  )
}
