'use client'

import * as React from 'react'
import { Check, Loader2, Search, X } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { useDebounce } from '@/utilities/useDebounce'
import { useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'

interface Skill {
  id: string | number
  name: string
  billingClass: string
  fullPath: string
  subCategory?: string
  category?: string
  discipline?: string
}

interface SkillSearchProps {
  value?: string
  onValueChange: (skillId: string) => void
  error?: string
}

export function SkillSearch({ value, onValueChange, error }: SkillSearchProps) {
  const t = useTranslations('registration.skillSearch')
  const pathname = usePathname()
  const locale = pathname.split('/')[1] || 'en'
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [skills, setSkills] = React.useState<Skill[]>([])
  const [loading, setLoading] = React.useState(false)
  const [selectedSkill, setSelectedSkill] = React.useState<Skill | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const debouncedQuery = useDebounce(searchQuery, 300)

  // Fetch skills when search query changes
  React.useEffect(() => {
    // Only fetch if query is long enough
    if (!debouncedQuery || debouncedQuery.trim().length < 2) {
      if (!searchQuery || searchQuery.trim().length === 0) {
        setSkills([])
        setOpen(false)
      }
      setLoading(false)
      return
    }

    setLoading(true)
    setOpen(true)
    const controller = new AbortController()
    
    fetch(`/api/skills/search?q=${encodeURIComponent(debouncedQuery)}&limit=10&locale=${locale}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        setSkills(data.skills || [])
        setLoading(false)
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.error('Error fetching skills:', error)
        }
        setLoading(false)
      })

    return () => {
      controller.abort()
    }
  }, [debouncedQuery, searchQuery])

  // Fetch selected skill details if value is set
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

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSelect = (skill: Skill) => {
    setSelectedSkill(skill)
    onValueChange(String(skill.id))
    setOpen(false)
    setSearchQuery('')
    setSkills([])
    inputRef.current?.blur()
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedSkill(null)
    setSearchQuery('')
    setSkills([])
    setOpen(false)
    onValueChange('')
    inputRef.current?.focus()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setSearchQuery(newValue)
    if (selectedSkill && newValue !== selectedSkill.fullPath) {
      // User is typing something different, clear selection
      setSelectedSkill(null)
      onValueChange('')
    }
  }

  const handleInputFocus = () => {
    if (searchQuery.trim().length >= 2 && skills.length > 0) {
      setOpen(true)
    }
  }

  const displayValue = selectedSkill ? selectedSkill.fullPath : searchQuery

  return (
    <Field data-invalid={!!error} className="relative">
      <FieldLabel htmlFor="skill-search">{t('label')}</FieldLabel>
      <Popover open={open && (loading || skills.length > 0 || (searchQuery.trim().length >= 2 && !loading))}>
        <div ref={containerRef} className="relative w-full">
          <PopoverAnchor asChild>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                ref={inputRef}
                id="skill-search"
                type="text"
                placeholder={t('placeholder')}
                value={displayValue}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                className={cn(
                  "w-full pl-9 pr-9",
                  error && "border-destructive focus-visible:ring-destructive",
                  selectedSkill && "pr-9"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
            <Command shouldFilter={false} className="max-h-[300px]">
              <CommandList>
                {loading && (
                  <div className="flex items-center justify-center p-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">{t('searching')}</span>
                  </div>
                )}
                {!loading && searchQuery.trim().length < 2 && (
                  <CommandEmpty>
                    <div className="py-6 text-center">
                      <p className="text-sm text-muted-foreground">
                        {t('minChars')}
                      </p>
                    </div>
                  </CommandEmpty>
                )}
                {!loading && searchQuery.trim().length >= 2 && skills.length === 0 && (
                  <CommandEmpty>
                    <div className="py-6 text-center">
                      <p className="text-sm text-muted-foreground mb-1">
                        {t('noResults')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('tryDifferent')}
                      </p>
                    </div>
                  </CommandEmpty>
                )}
                {!loading && skills.length > 0 && (
                  <CommandGroup>
                    {skills.map((skill) => (
                      <CommandItem
                        key={String(skill.id)}
                        value={skill.fullPath}
                        onSelect={() => handleSelect(skill)}
                        className="cursor-pointer py-3"
                      >
                        <Check
                          className={cn(
                            'mr-3 h-4 w-4 shrink-0',
                            selectedSkill?.id === String(skill.id) ? 'opacity-100 text-primary' : 'opacity-0',
                          )}
                        />
                        <div className="flex flex-col flex-1 gap-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">{skill.name}</span>
                            <Badge variant="outline" className="text-xs shrink-0">
                              {skill.billingClass}
                            </Badge>
                          </div>
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
              </CommandList>
            </Command>
          </PopoverContent>
        </div>
      </Popover>
      {selectedSkill && (
        <div className="mt-2 p-3 bg-muted/50 rounded-md border">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {selectedSkill.fullPath}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('billingClass')} <span className="font-medium">{selectedSkill.billingClass}</span>
              </p>
            </div>
          </div>
        </div>
      )}
      {error && <FieldError>{error}</FieldError>}
    </Field>
  )
}

