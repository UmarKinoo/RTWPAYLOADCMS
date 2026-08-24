'use client'

import * as React from 'react'
import { ArrowLeft, Check, ChevronRight, Loader2, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { useDebounce } from '@/utilities/useDebounce'
import { useTranslations, useLocale } from 'next-intl'
import type {
  SkillTree,
  SkillTreeCategory,
  SkillTreeIndustry,
  SkillTreeRole,
} from '@/lib/skills/tree'

/** Industries with more roles than this show a category step first. */
const CATEGORY_STEP_THRESHOLD = 30

interface Skill {
  id: string | number
  name: string
  billingClass?: string
  fullPath: string
  subCategory?: string
  category?: string
  discipline?: string
}

interface SkillSearchProps {
  value?: string
  onValueChange: (skillId: string) => void
  error?: string
  label?: string
  inputId?: string
  placeholder?: string
  excludeSkillIds?: string[]
}

type BrowseLevel = 'industries' | 'categories' | 'roles'

export function SkillSearch({
  value,
  onValueChange,
  error,
  label,
  inputId = 'skill-search',
  placeholder,
  excludeSkillIds = [],
}: SkillSearchProps) {
  const t = useTranslations('registration.skillSearch')
  const locale = useLocale()
  const isRtl = locale === 'ar'

  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [skills, setSkills] = React.useState<Skill[]>([])
  const [loading, setLoading] = React.useState(false)
  const [selectedSkill, setSelectedSkill] = React.useState<Skill | null>(null)
  const [tree, setTree] = React.useState<SkillTree | null>(null)
  const [treeLoading, setTreeLoading] = React.useState(false)
  const [treeError, setTreeError] = React.useState(false)
  const [browseIndustry, setBrowseIndustry] = React.useState<SkillTreeIndustry | null>(null)
  const [browseCategory, setBrowseCategory] = React.useState<SkillTreeCategory | null>(null)

  const inputRef = React.useRef<HTMLInputElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const debouncedQuery = useDebounce(searchQuery, 300)
  const isSearchMode = debouncedQuery.trim().length >= 2

  const browseLevel: BrowseLevel = !browseIndustry
    ? 'industries'
    : browseCategory || (browseIndustry && browseIndustry.roleCount <= CATEGORY_STEP_THRESHOLD)
      ? 'roles'
      : 'categories'

  // Reset cached tree when locale changes
  React.useEffect(() => {
    setTree(null)
    setTreeError(false)
    setBrowseIndustry(null)
    setBrowseCategory(null)
  }, [locale])

  // Load taxonomy tree once when popover opens for browse
  React.useEffect(() => {
    if (!open || tree || treeLoading) return
    setTreeLoading(true)
    setTreeError(false)
    fetch(`/api/skills/tree?locale=${locale}`)
      .then((res) => {
        if (!res.ok) throw new Error('tree failed')
        return res.json()
      })
      .then((data: SkillTree) => {
        setTree(data)
        setTreeLoading(false)
      })
      .catch(() => {
        setTreeError(true)
        setTreeLoading(false)
      })
  }, [open, tree, treeLoading, locale])

  // Search when query is long enough
  React.useEffect(() => {
    if (!debouncedQuery || debouncedQuery.trim().length < 2) {
      setSkills([])
      setLoading(false)
      return
    }

    setLoading(true)
    setOpen(true)
    const controller = new AbortController()

    fetch(
      `/api/skills/search?q=${encodeURIComponent(debouncedQuery)}&limit=10&locale=${locale}`,
      { signal: controller.signal },
    )
      .then((res) => res.json())
      .then((data) => {
        setSkills(data.skills || [])
        setLoading(false)
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error('Error fetching skills:', err)
        }
        setLoading(false)
      })

    return () => {
      controller.abort()
    }
  }, [debouncedQuery, locale])

  // Hydrate selected skill
  React.useEffect(() => {
    if (value && !selectedSkill) {
      fetch(`/api/skills/${value}?locale=${locale}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.skill) {
            setSelectedSkill({
              ...data.skill,
              id: String(data.skill.id),
            })
          }
        })
        .catch(console.error)
    } else if (!value) {
      setSelectedSkill(null)
      setSearchQuery('')
    }
  }, [value, selectedSkill, locale])

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const resetBrowse = () => {
    setBrowseIndustry(null)
    setBrowseCategory(null)
  }

  const handleSelectSkill = (skill: Skill) => {
    if (excludeSkillIds.includes(String(skill.id))) return
    setSelectedSkill(skill)
    onValueChange(String(skill.id))
    setOpen(false)
    setSearchQuery('')
    setSkills([])
    resetBrowse()
    inputRef.current?.blur()
  }

  const handleSelectRole = (
    role: SkillTreeRole,
    industry: SkillTreeIndustry,
    category: SkillTreeCategory,
  ) => {
    if (excludeSkillIds.includes(role.id)) return
    handleSelectSkill({
      id: role.id,
      name: role.name,
      fullPath: [industry.name, category.name, role.name].filter(Boolean).join(' > '),
      discipline: industry.name,
      category: category.name,
    })
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedSkill(null)
    setSearchQuery('')
    setSkills([])
    resetBrowse()
    setOpen(false)
    onValueChange('')
    inputRef.current?.focus()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setSearchQuery(newValue)
    if (selectedSkill && newValue !== selectedSkill.fullPath) {
      setSelectedSkill(null)
      onValueChange('')
    }
    if (newValue.trim().length > 0) {
      resetBrowse()
    }
  }

  const handleInputFocus = () => {
    setOpen(true)
  }

  const handleBack = () => {
    if (browseCategory) {
      setBrowseCategory(null)
      // If industry skips category step, going back from roles means leave industry
      if (browseIndustry && browseIndustry.roleCount <= CATEGORY_STEP_THRESHOLD) {
        setBrowseIndustry(null)
      }
      return
    }
    if (browseIndustry) {
      setBrowseIndustry(null)
    }
  }

  const displayValue = selectedSkill ? selectedSkill.fullPath : searchQuery
  const visibleSkills = skills.filter((skill) => !excludeSkillIds.includes(String(skill.id)))

  const rolesForBrowse: { category: SkillTreeCategory; roles: SkillTreeRole[] }[] = React.useMemo(() => {
    if (!browseIndustry) return []
    if (browseCategory) {
      return [
        {
          category: browseCategory,
          roles: browseCategory.roles.filter((r) => !excludeSkillIds.includes(r.id)),
        },
      ]
    }
    // Small industry: all roles grouped by category
    return browseIndustry.categories
      .map((cat) => ({
        category: cat,
        roles: cat.roles.filter((r) => !excludeSkillIds.includes(r.id)),
      }))
      .filter((g) => g.roles.length > 0)
  }, [browseIndustry, browseCategory, excludeSkillIds])

  const breadcrumbParts = [
    browseIndustry?.name,
    browseCategory?.name,
  ].filter(Boolean) as string[]

  const showPopover =
    open &&
    !selectedSkill &&
    (isSearchMode || treeLoading || tree || treeError || searchQuery.trim().length === 0)

  const Chevron = isRtl ? (
    // In RTL, "forward" is leftward; we still use ChevronRight with rotate for consistency
    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground rotate-180" />
  ) : (
    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
  )

  return (
    <Field data-invalid={!!error} className="relative">
      <FieldLabel htmlFor={inputId}>{label ?? t('label')}</FieldLabel>
      <Popover open={!!showPopover}>
        <div ref={containerRef} className="relative w-full">
          <PopoverAnchor asChild>
            <div className="relative">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                ref={inputRef}
                id={inputId}
                type="text"
                placeholder={placeholder ?? t('placeholder')}
                value={displayValue}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                className={cn(
                  'w-full ps-9 pe-9',
                  error && 'border-destructive focus-visible:ring-destructive',
                )}
                aria-expanded={open}
                aria-autocomplete="list"
                aria-haspopup="listbox"
                role="combobox"
              />
              {selectedSkill && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={t('clearSelection')}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </PopoverAnchor>

          <PopoverContent
            className="w-full p-0"
            align="start"
            side="bottom"
            sideOffset={4}
            onOpenAutoFocus={(e) => e.preventDefault()}
            style={{ width: containerRef.current?.offsetWidth }}
          >
            <Command shouldFilter={false} className="max-h-[320px]">
              <CommandList>
                {/* SEARCH MODE */}
                {isSearchMode && (
                  <>
                    {loading && (
                      <div className="flex items-center justify-center p-6">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        <span className="ms-2 text-sm text-muted-foreground">{t('searching')}</span>
                      </div>
                    )}
                    {!loading && visibleSkills.length === 0 && (
                      <CommandEmpty>
                        <div className="py-6 text-center">
                          <p className="text-sm text-muted-foreground mb-1">{t('noResults')}</p>
                          <p className="text-xs text-muted-foreground">{t('tryDifferent')}</p>
                        </div>
                      </CommandEmpty>
                    )}
                    {!loading && visibleSkills.length > 0 && (
                      <CommandGroup>
                        {visibleSkills.map((skill) => (
                          <CommandItem
                            key={String(skill.id)}
                            value={skill.fullPath}
                            onSelect={() => handleSelectSkill(skill)}
                            className="cursor-pointer py-3"
                          >
                            <Check
                              className={cn(
                                'me-3 h-4 w-4 shrink-0',
                                selectedSkill?.id === String(skill.id)
                                  ? 'opacity-100 text-primary'
                                  : 'opacity-0',
                              )}
                            />
                            <div className="flex flex-col flex-1 gap-0.5 min-w-0">
                              <span className="font-medium text-sm truncate">{skill.name}</span>
                              {skill.fullPath !== skill.name && (
                                <span className="text-xs text-muted-foreground truncate">
                                  {skill.fullPath}
                                </span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </>
                )}

                {/* BROWSE MODE */}
                {!isSearchMode && (
                  <>
                    {treeLoading && (
                      <div className="flex items-center justify-center p-6">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        <span className="ms-2 text-sm text-muted-foreground">{t('loadingIndustries')}</span>
                      </div>
                    )}

                    {treeError && !treeLoading && (
                      <div className="py-6 text-center px-4">
                        <p className="text-sm text-muted-foreground">{t('treeError')}</p>
                      </div>
                    )}

                    {!treeLoading && !treeError && tree && (
                      <>
                        {/* Header: browse label or back + breadcrumb */}
                        <div className="sticky top-0 z-10 border-b bg-popover px-2 py-2">
                          {browseLevel === 'industries' ? (
                            <p className="px-2 text-xs font-medium text-muted-foreground">
                              {t('browseByIndustry')}
                            </p>
                          ) : (
                            <div className="flex items-center gap-1 min-w-0">
                              <button
                                type="button"
                                onClick={handleBack}
                                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-foreground hover:bg-accent shrink-0"
                                aria-label={t('back')}
                              >
                                <ArrowLeft className={cn('h-4 w-4', isRtl && 'rotate-180')} />
                                <span className="sr-only sm:not-sr-only">{t('back')}</span>
                              </button>
                              <span className="text-muted-foreground text-xs truncate px-1" dir="auto">
                                {breadcrumbParts.join(isRtl ? ' ‹ ' : ' › ')}
                              </span>
                            </div>
                          )}
                        </div>

                        {browseLevel === 'industries' && (
                          <CommandGroup>
                            {tree.industries.map((industry) => (
                              <CommandItem
                                key={industry.id}
                                value={industry.name}
                                onSelect={() => {
                                  setBrowseIndustry(industry)
                                  setBrowseCategory(null)
                                }}
                                className="cursor-pointer py-3 justify-between"
                              >
                                <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                                  <span className="font-medium text-sm truncate">{industry.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {t('roleCount', { count: industry.roleCount })}
                                  </span>
                                </div>
                                {Chevron}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}

                        {browseLevel === 'categories' && browseIndustry && (
                          <CommandGroup>
                            {browseIndustry.categories.map((category) => (
                              <CommandItem
                                key={category.id}
                                value={category.name}
                                onSelect={() => setBrowseCategory(category)}
                                className="cursor-pointer py-3 justify-between"
                              >
                                <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                                  <span className="font-medium text-sm truncate">{category.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {t('roleCount', { count: category.roles.length })}
                                  </span>
                                </div>
                                {Chevron}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}

                        {browseLevel === 'roles' && browseIndustry && (
                          <>
                            {rolesForBrowse.length === 0 ? (
                              <CommandEmpty>
                                <div className="py-6 text-center">
                                  <p className="text-sm text-muted-foreground">{t('noResults')}</p>
                                </div>
                              </CommandEmpty>
                            ) : (
                              rolesForBrowse.map(({ category, roles }) => (
                                <CommandGroup
                                  key={category.id}
                                  heading={
                                    // Show category heading when browsing all roles in a small industry
                                    !browseCategory && rolesForBrowse.length > 1
                                      ? category.name
                                      : undefined
                                  }
                                >
                                  {roles.map((role) => (
                                    <CommandItem
                                      key={role.id}
                                      value={`${category.name}-${role.name}`}
                                      onSelect={() =>
                                        handleSelectRole(role, browseIndustry, category)
                                      }
                                      className="cursor-pointer py-3"
                                    >
                                      <Check
                                        className={cn(
                                          'me-3 h-4 w-4 shrink-0',
                                          selectedSkill?.id === role.id
                                            ? 'opacity-100 text-primary'
                                            : 'opacity-0',
                                        )}
                                      />
                                      <span className="font-medium text-sm truncate">{role.name}</span>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              ))
                            )}
                          </>
                        )}
                      </>
                    )}
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </div>
      </Popover>

      {selectedSkill && (
        <div className="mt-2 p-3 bg-muted/50 rounded-md border">
          <p className="text-sm font-medium text-foreground truncate" dir="auto">
            {selectedSkill.fullPath}
          </p>
        </div>
      )}
      {error && <FieldError>{error}</FieldError>}
    </Field>
  )
}
