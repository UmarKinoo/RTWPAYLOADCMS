'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { useDebounce } from '@/utilities/useDebounce'

interface Skill {
  id: string | number
  name: string
  billingClass: string
  fullPath: string
}

interface SkillSearchProps {
  value?: string
  onValueChange: (skillId: string) => void
  error?: string
}

export function SkillSearch({ value, onValueChange, error }: SkillSearchProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [skills, setSkills] = React.useState<Skill[]>([])
  const [loading, setLoading] = React.useState(false)
  const [selectedSkill, setSelectedSkill] = React.useState<Skill | null>(null)

  const debouncedQuery = useDebounce(searchQuery, 300)

  // Fetch skills when search query changes
  React.useEffect(() => {
    // Only fetch if query is long enough
    if (!debouncedQuery || debouncedQuery.trim().length < 2) {
      // Don't clear results immediately - keep them visible
      // Only clear if search query is also empty/short (user cleared the field)
      if (!searchQuery || searchQuery.trim().length === 0) {
        setSkills([])
      }
      setLoading(false)
      return
    }

    setLoading(true)
    const controller = new AbortController()
    
    fetch(`/api/skills/search?q=${encodeURIComponent(debouncedQuery)}&limit=10`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        // Always update with new results
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
      fetch(`/api/skills/${value}`)
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
    }
  }, [value, selectedSkill])

  const handleSelect = (skill: Skill) => {
    setSelectedSkill(skill)
    onValueChange(String(skill.id))
    setOpen(false)
    setSearchQuery('')
    setSkills([]) // Clear search results after selection
  }

  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor="skill-search">Search your Job Role or Skill *</FieldLabel>
      <Popover 
        open={open} 
        onOpenChange={(newOpen) => {
          setOpen(newOpen)
          // Clear search when popover closes (but keep results visible briefly)
          if (!newOpen && searchQuery.trim().length === 0) {
            setSearchQuery('')
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            data-invalid={!!error}
          >
            {selectedSkill ? selectedSkill.fullPath : 'Search for your job role...'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-full p-0" 
          align="start" 
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            // Prevent closing when clicking inside the command input
            const target = e.target as HTMLElement
            if (target.closest('[cmdk-input]')) {
              e.preventDefault()
            }
          }}
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Type to search (e.g., Mason, Engineer...)"
              value={searchQuery}
              onValueChange={(value) => {
                setSearchQuery(value)
                // Keep popover open when typing
                if (!open) {
                  setOpen(true)
                }
              }}
              onKeyDown={(e) => {
                // Prevent popover from closing on Escape if there are results
                if (e.key === 'Escape' && skills.length > 0) {
                  e.stopPropagation()
                }
              }}
            />
            <CommandList>
              {loading && (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
              {!loading && (
                <>
                  <CommandEmpty>
                    {searchQuery.trim().length < 2
                      ? 'Type at least 2 characters to search'
                      : 'No skills found. Try a different search term.'}
                  </CommandEmpty>
                  {skills.length > 0 && (
                    <CommandGroup>
                      {skills.map((skill) => (
                        <CommandItem
                          key={String(skill.id)}
                          value={skill.fullPath}
                          onSelect={() => handleSelect(skill)}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4 shrink-0',
                              selectedSkill?.id === String(skill.id) ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                          <div className="flex flex-col flex-1">
                            <span className="font-medium">{skill.fullPath}</span>
                            <span className="text-xs text-muted-foreground">
                              Billing Class: {skill.billingClass}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && <FieldError>{error}</FieldError>}
    </Field>
  )
}

