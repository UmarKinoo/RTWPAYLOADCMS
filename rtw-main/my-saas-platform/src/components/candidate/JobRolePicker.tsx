'use client'

import * as React from 'react'
import Image from 'next/image'
import { ArrowLeft, ArrowRight, ChevronDown, Loader2, Plus, Search, X } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDebounce } from '@/utilities/useDebounce'
import { getDisciplineImage } from '@/lib/disciplines/images'
import type {
  SkillTree,
  SkillTreeCategory,
  SkillTreeIndustry,
  SkillTreeRole,
} from '@/lib/skills/tree'

/** Industries with more roles than this show a category step first. */
const CATEGORY_STEP_THRESHOLD = 30

interface SelectedSkill {
  id: string
  name: string
  industry?: string
  category?: string
  industryNameEn?: string
  fullPath: string
}

interface SearchHit {
  id: string
  name: string
  fullPath: string
  industry?: string
  category?: string
}

export interface JobRolePickerProps {
  value?: string
  onValueChange: (skillId: string) => void
  label?: string
  error?: string
  excludeSkillIds?: string[]
  forceOpen?: boolean
  onRemove?: () => void
  className?: string
}

type Stage = 'industry' | 'category' | 'role'
/** browsing = first-time wizard; pathEdit = Change with industry/category dropdowns */
type Mode = 'browse' | 'pathEdit'

function PathCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div
      className={cn(
        'min-w-0 flex-1 rounded-xl border p-3 sm:p-3.5 text-start',
        accent
          ? 'border-[#4644b8] bg-[#4644b8] text-white'
          : 'border-gray-200 bg-gray-50 text-[#16252d]',
      )}
    >
      <p
        className={cn(
          'text-[10px] sm:text-xs font-semibold uppercase tracking-wide mb-1.5',
          accent ? 'text-white/80' : 'text-gray-500',
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          'text-xs sm:text-sm font-semibold leading-snug line-clamp-2 min-w-0',
          accent ? 'text-white' : 'text-[#16252d]',
        )}
        dir="auto"
      >
        {value}
      </p>
    </div>
  )
}

function PathSelectCard({
  label,
  value,
  placeholder,
  options,
  onChange,
  disabled,
}: {
  label: string
  value?: string
  placeholder: string
  options: { id: string; name: string }[]
  onChange: (id: string) => void
  disabled?: boolean
}) {
  return (
    <div className="min-w-0 flex-1 rounded-xl border border-[#4644b8]/40 bg-[#f3f0ff] p-2.5 sm:p-3 text-start">
      <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide mb-1.5 text-[#4644b8]">
        {label}
      </p>
      <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="h-9 w-full border-[#4644b8]/30 bg-white text-sm font-semibold text-[#4644b8] shadow-none">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.id} value={opt.id} className="text-[#16252d]">
              {opt.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function JobRolePicker({
  value,
  onValueChange,
  label,
  error,
  excludeSkillIds = [],
  forceOpen = false,
  onRemove,
  className,
}: JobRolePickerProps) {
  const t = useTranslations('registration.jobRolePicker')
  const locale = useLocale()
  const isRtl = locale === 'ar'

  const [tree, setTree] = React.useState<SkillTree | null>(null)
  const [treeLoading, setTreeLoading] = React.useState(false)
  const [treeError, setTreeError] = React.useState(false)
  const [selected, setSelected] = React.useState<SelectedSkill | null>(null)
  const [editing, setEditing] = React.useState(forceOpen || !value)
  const [mode, setMode] = React.useState<Mode>('browse')
  const [industry, setIndustry] = React.useState<SkillTreeIndustry | null>(null)
  const [category, setCategory] = React.useState<SkillTreeCategory | null>(null)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [searchHits, setSearchHits] = React.useState<SearchHit[]>([])
  const [searchLoading, setSearchLoading] = React.useState(false)

  const debouncedQuery = useDebounce(searchQuery, 300)
  const isSearchMode = mode === 'browse' && debouncedQuery.trim().length >= 2

  const stage: Stage = !industry
    ? 'industry'
    : category || industry.roleCount <= CATEGORY_STEP_THRESHOLD
      ? 'role'
      : 'category'

  React.useEffect(() => {
    if (forceOpen) {
      setEditing(true)
      setMode('browse')
    } else if (!value) {
      setEditing(true)
      setMode('browse')
    }
  }, [forceOpen, value])

  // Hydrate selected skill
  React.useEffect(() => {
    if (!value) {
      setSelected(null)
      return
    }
    if (selected?.id === value) return

    let cancelled = false
    fetch(`/api/skills/${value}?locale=${locale}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data.skill) return
        setSelected({
          id: String(data.skill.id),
          name: data.skill.name,
          industry: data.skill.discipline,
          category: data.skill.category,
          fullPath: data.skill.fullPath || data.skill.name,
        })
      })
      .catch(console.error)

    return () => {
      cancelled = true
    }
  }, [value, locale, selected?.id])

  // Load tree whenever editing (browse or pathEdit) or when we need image for summary
  const needsTree = editing || Boolean(selected)
  React.useEffect(() => {
    if (!needsTree || tree || treeLoading) return
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
  }, [needsTree, tree, treeLoading, locale])

  React.useEffect(() => {
    setTree(null)
    setTreeError(false)
    setIndustry(null)
    setCategory(null)
  }, [locale])

  // Enrich selected with nameEn once tree loads
  React.useEffect(() => {
    if (!selected?.industry || selected.industryNameEn || !tree) return
    const match = tree.industries.find(
      (i) => i.name === selected.industry || i.nameEn === selected.industry,
    )
    if (match) {
      setSelected((prev) =>
        prev ? { ...prev, industryNameEn: match.nameEn, industry: match.name } : prev,
      )
    }
  }, [tree, selected?.industry, selected?.industryNameEn])

  React.useEffect(() => {
    if (!editing || !isSearchMode) {
      setSearchHits([])
      setSearchLoading(false)
      return
    }
    setSearchLoading(true)
    const controller = new AbortController()
    fetch(
      `/api/skills/search?q=${encodeURIComponent(debouncedQuery)}&limit=10&locale=${locale}`,
      { signal: controller.signal },
    )
      .then((res) => res.json())
      .then((data) => {
        const hits: SearchHit[] = (data.skills || [])
          .filter((s: { id: string }) => !excludeSkillIds.includes(String(s.id)))
          .map(
            (s: {
              id: string
              name: string
              fullPath?: string
              discipline?: string
              category?: string
            }) => ({
              id: String(s.id),
              name: s.name,
              fullPath: s.fullPath || s.name,
              industry: s.discipline,
              category: s.category,
            }),
          )
        setSearchHits(hits)
        setSearchLoading(false)
      })
      .catch((err) => {
        if (err.name !== 'AbortError') console.error(err)
        setSearchLoading(false)
      })
    return () => controller.abort()
  }, [debouncedQuery, editing, isSearchMode, locale, excludeSkillIds])

  const resetBrowse = () => {
    setIndustry(null)
    setCategory(null)
    setSearchQuery('')
    setSearchHits([])
  }

  const handleSelect = (skill: SelectedSkill) => {
    if (excludeSkillIds.includes(skill.id)) return
    // Resolve English industry name for image lookup (search results may only have localized names)
    let enriched = skill
    if (tree && skill.industry && !skill.industryNameEn) {
      const match = tree.industries.find(
        (i) => i.name === skill.industry || i.nameEn === skill.industry,
      )
      if (match) {
        enriched = { ...skill, industryNameEn: match.nameEn, industry: match.name }
      }
    }
    setSelected(enriched)
    onValueChange(enriched.id)
    setEditing(false)
    setMode('browse')
    resetBrowse()
  }

  const handleSelectRole = (
    role: SkillTreeRole,
    ind: SkillTreeIndustry,
    cat: SkillTreeCategory,
  ) => {
    handleSelect({
      id: role.id,
      name: role.name,
      industry: ind.name,
      category: cat.name,
      industryNameEn: ind.nameEn,
      fullPath: [ind.name, cat.name, role.name].filter(Boolean).join(' > '),
    })
  }

  /** Change → back to first window (industry / search picker) */
  const handleChange = () => {
    setMode('browse')
    setEditing(true)
    setSelected(null)
    onValueChange('')
    resetBrowse()
  }

  const prefillsFromSelected = React.useCallback(() => {
    if (!tree || !selected) {
      setIndustry(null)
      setCategory(null)
      return
    }
    const ind =
      tree.industries.find(
        (i) => i.name === selected.industry || i.nameEn === selected.industry,
      ) || null
    setIndustry(ind)
    const cat =
      ind?.categories.find((c) => c.name === selected.category) ||
      (ind && ind.categories.length === 1 ? ind.categories[0] : null) ||
      null
    setCategory(cat)
  }, [tree, selected])

  // When tree arrives during pathEdit, prefill dropdowns from current selection
  React.useEffect(() => {
    if (editing && mode === 'pathEdit' && tree && selected && !industry) {
      prefillsFromSelected()
    }
  }, [editing, mode, tree, selected, industry, prefillsFromSelected])

  const handleIndustryDropdown = (industryId: string) => {
    if (industry?.id === industryId) return
    const ind = tree?.industries.find((i) => i.id === industryId) || null
    setIndustry(ind)
    setCategory(null)
    setSelected(null)
    onValueChange('')
  }

  const handleCategoryDropdown = (categoryId: string) => {
    if (category?.id === categoryId) return
    const cat = industry?.categories.find((c) => c.id === categoryId) || null
    setCategory(cat)
    setSelected(null)
    onValueChange('')
  }

  const handleBack = () => {
    if (mode === 'pathEdit') {
      // Exit path edit without clearing if we still have a selection
      if (selected && value) {
        setEditing(false)
        setMode('browse')
        resetBrowse()
        return
      }
      setMode('browse')
      resetBrowse()
      return
    }
    if (category) {
      setCategory(null)
      if (industry && industry.roleCount <= CATEGORY_STEP_THRESHOLD) {
        setIndustry(null)
      }
      return
    }
    if (industry) setIndustry(null)
  }

  const breadcrumbParts = [industry?.name, category?.name].filter(Boolean) as string[]

  const rolesForBrowse = React.useMemo(() => {
    if (!industry) return []
    if (category) {
      return [
        {
          category,
          roles: category.roles.filter((r) => !excludeSkillIds.includes(r.id)),
        },
      ]
    }
    return industry.categories
      .map((cat) => ({
        category: cat,
        roles: cat.roles.filter((r) => !excludeSkillIds.includes(r.id)),
      }))
      .filter((g) => g.roles.length > 0)
  }, [industry, category, excludeSkillIds])

  const pathEditRoles = React.useMemo(() => {
    if (!category) return []
    return category.roles.filter((r) => !excludeSkillIds.includes(r.id))
  }, [category, excludeSkillIds])

  const showSummary = !editing && !!selected
  const showPathEdit = editing && mode === 'pathEdit'
  const PathArrow = isRtl ? ArrowLeft : ArrowRight

  const pathIndustry = selected?.industry || industry?.name
  const pathCategory = selected?.category || category?.name
  const pathRole = selected?.name
  const industryImage =
    getDisciplineImage(
      selected?.industryNameEn,
      industry?.nameEn,
      selected?.industry,
      industry?.name,
    ) ||
    (tree && (selected?.industry || industry?.name)
      ? getDisciplineImage(
          tree.industries.find(
            (i) =>
              i.name === (selected?.industry || industry?.name) ||
              i.nameEn === (selected?.industry || industry?.name) ||
              i.id === industry?.id,
          )?.nameEn,
          selected?.industry,
          industry?.name,
        )
      : undefined)

  const pathRow = (editable: boolean) => (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-3">
      {industryImage && (
        <div className="relative mx-auto h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-gray-100 sm:mx-0 sm:h-auto sm:w-28 sm:min-h-[7.5rem]">
          <Image
            src={industryImage}
            alt={pathIndustry || ''}
            fill
            className="object-cover"
            sizes="112px"
          />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col sm:flex-row items-stretch gap-2 sm:gap-1.5">
        {editable && tree ? (
          <>
            <PathSelectCard
              label={t('pathIndustry')}
              value={industry?.id}
              placeholder={t('selectIndustry')}
              options={tree.industries.map((i) => ({ id: i.id, name: i.name }))}
              onChange={handleIndustryDropdown}
            />
            <div className="flex items-center justify-center shrink-0 px-0.5">
              <PathArrow className="size-4 text-[#4644b8] rotate-90 sm:rotate-0" />
            </div>
            <PathSelectCard
              label={t('pathCategory')}
              value={category?.id}
              placeholder={t('selectCategory')}
              options={(industry?.categories || []).map((c) => ({ id: c.id, name: c.name }))}
              onChange={handleCategoryDropdown}
              disabled={!industry}
            />
            <div className="flex items-center justify-center shrink-0 px-0.5">
              <PathArrow className="size-4 text-[#4644b8] rotate-90 sm:rotate-0" />
            </div>
            <PathCard
              label={t('pathRole')}
              value={pathRole || t('chooseRole')}
              accent={Boolean(pathRole)}
            />
          </>
        ) : (
          <>
            {pathIndustry && (
              <>
                <PathCard label={t('pathIndustry')} value={pathIndustry} />
                {(pathCategory || pathRole) && (
                  <div className="flex items-center justify-center shrink-0 px-0.5">
                    <PathArrow className="size-4 text-[#4644b8] rotate-90 sm:rotate-0" />
                  </div>
                )}
              </>
            )}
            {pathCategory && (
              <>
                <PathCard label={t('pathCategory')} value={pathCategory} />
                {pathRole && (
                  <div className="flex items-center justify-center shrink-0 px-0.5">
                    <PathArrow className="size-4 text-[#4644b8] rotate-90 sm:rotate-0" />
                  </div>
                )}
              </>
            )}
            {pathRole && <PathCard label={t('pathRole')} value={pathRole} accent />}
          </>
        )}
      </div>
    </div>
  )

  return (
    <Field data-invalid={!!error} className={cn('relative space-y-3', className)}>
      {label && <FieldLabel>{label}</FieldLabel>}

      {showSummary && selected && (
        <div className="rounded-2xl border border-gray-200 bg-white p-3 sm:p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {t('yourPath')}
            </p>
            <div className="flex shrink-0 gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleChange}
                className="border-gray-300 bg-white text-[#16252d] hover:bg-gray-100 hover:text-[#16252d]"
              >
                {t('change')}
              </Button>
              {onRemove && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onRemove()
                    setSelected(null)
                    setEditing(false)
                    setMode('browse')
                    resetBrowse()
                  }}
                  aria-label={t('remove')}
                  className="text-gray-600 hover:bg-gray-100"
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
          </div>
          {pathRow(false)}
        </div>
      )}

      {showPathEdit && (
        <div className="rounded-2xl border border-[#4644b8]/30 bg-white p-3 sm:p-4 space-y-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-[#16252d] hover:bg-gray-100"
            >
              <ArrowLeft className={cn('size-4', isRtl && 'rotate-180')} />
              {t('back')}
            </button>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#4644b8]">
              {t('editPath')}
            </p>
          </div>

          {treeLoading && (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-[#4644b8]">
              <Loader2 className="size-5 animate-spin" />
              {t('loadingIndustries')}
            </div>
          )}

          {tree && (
            <>
              {pathRow(true)}

              {/* Job roles for the selected category — pick to finish */}
              {category && (
                <div className="space-y-2 border-t border-gray-100 pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#4644b8]">
                    {t('chooseRole')}
                  </p>
                  {pathEditRoles.length === 0 ? (
                    <p className="py-4 text-center text-sm text-gray-500">{t('noResults')}</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 max-h-[280px] overflow-y-auto">
                      {pathEditRoles.map((role) => (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() =>
                            industry && category && handleSelectRole(role, industry, category)
                          }
                          className={cn(
                            'flex min-h-[4.5rem] flex-col items-start justify-center rounded-2xl border p-3 text-start transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400',
                            selected?.id === role.id
                              ? 'border-[#4644b8] bg-[#4644b8] text-white'
                              : 'border-gray-200 bg-gray-50 text-[#16252d] hover:border-gray-300 hover:bg-white hover:shadow-sm',
                          )}
                        >
                          <span className="text-sm font-semibold line-clamp-3" dir="auto">
                            {role.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!category && industry && (
                <p className="text-sm text-[#4644b8] flex items-center gap-1.5">
                  <ChevronDown className="size-4" />
                  {t('selectCategory')}
                </p>
              )}
            </>
          )}
        </div>
      )}

      {editing && mode === 'browse' && (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          {(stage === 'industry' || isSearchMode) && (
            <div className="border-b border-gray-100 p-3 sm:p-4 space-y-2 bg-gray-50/80">
              <p className="text-xs font-medium text-gray-600">{t('searchShortcut')}</p>
              <div className="relative">
                <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    if (e.target.value.trim().length > 0) {
                      setIndustry(null)
                      setCategory(null)
                    }
                  }}
                  placeholder={t('searchPlaceholder')}
                  className="ps-9 bg-white"
                  autoComplete="off"
                />
              </div>
            </div>
          )}

          {!isSearchMode && stage !== 'industry' && industry && (
            <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-100 bg-white px-3 py-3 sm:px-4">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-[#16252d] hover:bg-gray-100 shrink-0"
                aria-label={t('back')}
              >
                <ArrowLeft className={cn('size-4', isRtl && 'rotate-180')} />
                <span>{t('back')}</span>
              </button>
              {getDisciplineImage(industry.nameEn, industry.name) && (
                <div className="relative size-9 shrink-0 overflow-hidden rounded-lg bg-gray-200">
                  <Image
                    src={getDisciplineImage(industry.nameEn, industry.name)!}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="36px"
                  />
                </div>
              )}
              <span className="text-sm font-semibold text-[#16252d] truncate" dir="auto">
                {breadcrumbParts.join(isRtl ? ' ‹ ' : ' › ')}
              </span>
            </div>
          )}

          <div className="max-h-[min(480px,60vh)] overflow-y-auto p-3 sm:p-4">
            {treeLoading && (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
                <Loader2 className="size-5 animate-spin" />
                {t('loadingIndustries')}
              </div>
            )}

            {treeError && !treeLoading && (
              <p className="py-8 text-center text-sm text-gray-500">{t('treeError')}</p>
            )}

            {isSearchMode && (
              <div className="space-y-3">
                {searchLoading && (
                  <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
                    <Loader2 className="size-5 animate-spin" />
                    {t('searching')}
                  </div>
                )}
                {!searchLoading && searchHits.length === 0 && (
                  <p className="py-8 text-center text-sm text-gray-500">{t('noResults')}</p>
                )}
                {!searchLoading && searchHits.length > 0 && (
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
                    {searchHits.map((hit) => (
                      <button
                        key={hit.id}
                        type="button"
                        onClick={() =>
                          handleSelect({
                            id: hit.id,
                            name: hit.name,
                            industry: hit.industry,
                            category: hit.category,
                            fullPath: hit.fullPath,
                          })
                        }
                        className="flex flex-col items-start gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-start shadow-sm transition-all hover:border-gray-300 hover:bg-gray-100 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                      >
                        <span
                          className="text-sm font-bold leading-snug text-[#16252d] line-clamp-2"
                          dir="auto"
                        >
                          {hit.name}
                        </span>
                        {(hit.industry || hit.category) && (
                          <span
                            className="text-xs font-medium leading-snug text-gray-600 line-clamp-2"
                            dir="auto"
                          >
                            {[hit.industry, hit.category].filter(Boolean).join(' → ')}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!isSearchMode && !treeLoading && !treeError && tree && stage === 'industry' && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-[#16252d]">{t('chooseIndustry')}</p>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
                  {tree.industries.map((ind) => {
                    const image = getDisciplineImage(ind.nameEn, ind.name)
                    return (
                      <button
                        key={ind.id}
                        type="button"
                        onClick={() => {
                          setIndustry(ind)
                          setCategory(null)
                          setSearchQuery('')
                        }}
                        className="group flex items-center gap-3 rounded-2xl bg-gray-100 p-2 pe-3 text-start transition-all hover:bg-[#e9d5ff] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4644b8]"
                      >
                        <div className="relative size-14 sm:size-16 shrink-0 overflow-hidden rounded-xl bg-gray-200">
                          {image ? (
                            <Image
                              src={image}
                              alt=""
                              fill
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                              sizes="64px"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center text-xs font-bold text-[#4644b8]">
                              {ind.name.slice(0, 1)}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span
                            className="block text-sm font-bold leading-snug text-[#16252d] line-clamp-2"
                            dir="auto"
                          >
                            {ind.name}
                          </span>
                          <span className="mt-0.5 block text-xs text-gray-600">
                            {t('roleCount', { count: ind.roleCount })}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {!isSearchMode && industry && stage === 'category' && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-[#16252d]">{t('chooseCategory')}</p>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
                  {industry.categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className="flex min-h-[5.5rem] flex-col items-start justify-between gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-3.5 text-start shadow-sm transition-all hover:border-gray-300 hover:bg-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                    >
                      <span
                        className="text-sm font-semibold leading-snug text-[#16252d] line-clamp-3"
                        dir="auto"
                      >
                        {cat.name}
                      </span>
                      <span className="mt-auto text-[11px] font-medium text-gray-500">
                        {t('roleCount', { count: cat.roles.length })}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!isSearchMode && industry && stage === 'role' && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-[#16252d]">{t('chooseRole')}</p>
                {rolesForBrowse.length === 0 ? (
                  <p className="py-6 text-center text-sm text-gray-500">{t('noResults')}</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
                    {rolesForBrowse.flatMap(({ category: cat, roles }) =>
                      roles.map((role) => (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => handleSelectRole(role, industry, cat)}
                          className="flex min-h-[5.5rem] flex-col items-start justify-between gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-3.5 text-start shadow-sm transition-all hover:border-gray-300 hover:bg-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                        >
                          <span
                            className="text-sm font-semibold leading-snug text-[#16252d] line-clamp-3"
                            dir="auto"
                          >
                            {role.name}
                          </span>
                          {!category && rolesForBrowse.length > 1 && (
                            <span
                              className="mt-auto text-[11px] font-medium leading-snug text-gray-500 line-clamp-2"
                              dir="auto"
                            >
                              {cat.name}
                            </span>
                          )}
                        </button>
                      )),
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {error && <FieldError>{error}</FieldError>}
    </Field>
  )
}

export function AddJobRoleButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full justify-start gap-2 border-dashed border-gray-300 text-[#16252d]"
      onClick={onClick}
    >
      <Plus className="size-4" />
      {label}
    </Button>
  )
}
