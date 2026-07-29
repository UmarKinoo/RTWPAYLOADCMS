'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { toast } from 'sonner'
import {
  Search,
  ChevronLeft,
  Loader2,
  Check,
  Plus,
  AlertTriangle,
  RefreshCw,
  Briefcase,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

// ─── Types ──────────────────────────────────────────────────────────

interface OccupationResult {
  uri: string
  preferredLabel: string
  altLabels: string[]
  description?: string
  score: number
}

interface EscoSkill {
  uri: string
  label: string
  skillType: 'essential' | 'optional'
}

interface OccupationDetail {
  uri: string
  preferredLabel: string
  altLabels: string[]
  description: string
  essentialSkills: EscoSkill[]
  optionalSkills: EscoSkill[]
}

interface SavedOccupation {
  id: string
  preferredLabel: string
  escoUri: string
  skills: Array<{ label: string; type: 'essential' | 'optional' }>
  isUnmapped: boolean
}

type Step = 'search' | 'results' | 'confirm' | 'skills' | 'saved' | 'notListed'

// ─── Session ID ─────────────────────────────────────────────────────

function getSessionId(): string {
  const key = 'esco-demo-session-id'
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }
  return id
}

// ─── Component ──────────────────────────────────────────────────────

export function EscoWizard() {
  const t = useTranslations('demoCandReg')
  const locale = useLocale()

  const [step, setStep] = useState<Step>('search')
  const [inputText, setInputText] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [results, setResults] = useState<OccupationResult[]>([])
  const [moreResults, setMoreResults] = useState<OccupationResult[]>([])
  const [searchLogId, setSearchLogId] = useState<string | null>(null)
  const [selectedOccupation, setSelectedOccupation] = useState<OccupationResult | null>(null)
  const [occupationDetail, setOccupationDetail] = useState<OccupationDetail | null>(null)
  const [selectedSkillUris, setSelectedSkillUris] = useState<Set<string>>(new Set())
  const [savedOccupations, setSavedOccupations] = useState<SavedOccupation[]>([])
  const [loadingDetail, setLoadingDetail] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Persist input text across sessions
  useEffect(() => {
    const saved = localStorage.getItem('esco-demo-input')
    if (saved) setInputText(saved)
  }, [])
  useEffect(() => {
    if (inputText) localStorage.setItem('esco-demo-input', inputText)
  }, [inputText])

  // ─── API Calls ──────────────────────────────────────────────────

  const handleSearch = useCallback(async () => {
    if (!inputText.trim() || inputText.trim().length < 2) return
    setIsSearching(true)
    setSearchError(null)
    try {
      const res = await fetch('/api/esco/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: inputText.trim(),
          language: locale,
          sessionId: getSessionId(),
        }),
      })
      if (res.status === 503) {
        setSearchError(t('escoUnavailable'))
        setStep('results')
        return
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setSearchError(data.error || 'Search failed')
        setStep('results')
        return
      }
      const data = await res.json()
      setResults(data.results ?? [])
      setMoreResults(data.moreResults ?? [])
      setSearchLogId(data.searchLogId ?? null)
      setStep('results')
    } catch {
      setSearchError(t('escoUnavailable'))
      setStep('results')
    } finally {
      setIsSearching(false)
    }
  }, [inputText, locale, t])

  const fetchOccupationDetail = useCallback(
    async (uri: string) => {
      setLoadingDetail(true)
      try {
        const res = await fetch(
          `/api/esco/occupation?uri=${encodeURIComponent(uri)}&language=${locale}`,
        )
        if (!res.ok) throw new Error()
        const data = await res.json()
        setOccupationDetail(data.occupation)
      } catch {
        toast.error(t('escoUnavailable'))
        setOccupationDetail(null)
      } finally {
        setLoadingDetail(false)
      }
    },
    [locale, t],
  )

  const handleSelectOccupation = useCallback(
    async (occ: OccupationResult) => {
      setSelectedOccupation(occ)
      setStep('confirm')
      await fetchOccupationDetail(occ.uri)
    },
    [fetchOccupationDetail],
  )

  const handleConfirm = useCallback(() => {
    if (!occupationDetail) return
    // Pre-select all essential skills
    const essentialUris = new Set(occupationDetail.essentialSkills.map((s) => s.uri))
    setSelectedSkillUris(essentialUris)
    setStep('skills')
  }, [occupationDetail])

  const toggleSkill = useCallback((uri: string) => {
    setSelectedSkillUris((prev) => {
      const next = new Set(prev)
      if (next.has(uri)) next.delete(uri)
      else next.add(uri)
      return next
    })
  }, [])

  const handleSaveSkills = useCallback(async () => {
    if (!occupationDetail || !selectedOccupation) return
    if (selectedSkillUris.size === 0) {
      toast.error(t('noSkillsSelected'))
      return
    }
    setIsSaving(true)
    try {
      const allSkills = [
        ...occupationDetail.essentialSkills,
        ...occupationDetail.optionalSkills,
      ]
      const selectedSkills = allSkills
        .filter((s) => selectedSkillUris.has(s.uri))
        .map((s) => ({
          escoSkillUri: s.uri,
          skillLabel: s.label,
          skillType: s.skillType,
          candidateSelected: true,
        }))

      const res = await fetch('/api/demo-cand-reg/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: getSessionId(),
          escoUri: selectedOccupation.uri,
          preferredLabel: selectedOccupation.preferredLabel,
          language: locale,
          originalWording: inputText,
          skills: selectedSkills,
          searchLogId,
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()

      setSavedOccupations((prev) => [
        ...prev,
        {
          id: data.occupationId,
          preferredLabel: selectedOccupation.preferredLabel,
          escoUri: selectedOccupation.uri,
          skills: selectedSkills.map((s) => ({ label: s.skillLabel, type: s.skillType })),
          isUnmapped: false,
        },
      ])
      toast.success(t('step5Title'))
      setStep('saved')
    } catch {
      toast.error('Failed to save. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }, [occupationDetail, selectedOccupation, selectedSkillUris, locale, inputText, searchLogId, t])

  const handleNotListedSubmit = useCallback(
    async (customTitle: string) => {
      if (!customTitle.trim()) return
      setIsSaving(true)
      try {
        const res = await fetch('/api/demo-cand-reg/not-listed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: getSessionId(),
            customTitle: customTitle.trim(),
            originalWording: inputText,
            language: locale,
          }),
        })
        if (!res.ok) throw new Error()
        const data = await res.json()

        setSavedOccupations((prev) => [
          ...prev,
          {
            id: data.occupationId,
            preferredLabel: customTitle.trim(),
            escoUri: '',
            skills: [],
            isUnmapped: true,
          },
        ])
        toast.success(t('step5Title'))
        setStep('saved')
      } catch {
        toast.error('Failed to save. Please try again.')
      } finally {
        setIsSaving(false)
      }
    },
    [inputText, locale, t],
  )

  const handleAddAnother = useCallback(() => {
    setInputText('')
    setResults([])
    setMoreResults([])
    setSelectedOccupation(null)
    setOccupationDetail(null)
    setSelectedSkillUris(new Set())
    setSearchError(null)
    setStep('search')
    localStorage.removeItem('esco-demo-input')
  }, [])

  const handleLoadMore = useCallback(() => {
    setResults((prev) => [...prev, ...moreResults.slice(0, 8)])
    setMoreResults((prev) => prev.slice(8))
  }, [moreResults])

  // ─── Example Chips ────────────────────────────────────────────────

  const exampleChips = [
    { key: 'acWorker', text: t('exampleChips.acWorker') },
    { key: 'driver', text: t('exampleChips.driver') },
    { key: 'housekeeper', text: t('exampleChips.housekeeper') },
    { key: 'electrician', text: t('exampleChips.electrician') },
    { key: 'warehouse', text: t('exampleChips.warehouse') },
    { key: 'cook', text: t('exampleChips.cook') },
  ]

  // ─── Render Steps ─────────────────────────────────────────────────

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Saved occupations banner */}
      {savedOccupations.length > 0 && step !== 'saved' && (
        <Card className="border-[#4644b8]/20 bg-[#4644b8]/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-4 h-4 text-[#4644b8]" />
              <span className="font-medium text-sm text-[#16252d]">
                {t('savedOccupations')}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {savedOccupations.map((occ) => (
                <Badge key={occ.id} variant="secondary" className="text-xs">
                  {occ.preferredLabel}
                  {occ.skills.length > 0 && (
                    <span className="ml-1 opacity-60">
                      ({occ.skills.length} {t('skills')})
                    </span>
                  )}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Search */}
      {step === 'search' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl text-[#16252d]">
              {t('step1Title')}
            </CardTitle>
            <CardDescription>{t('step1Hint')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t('step1Placeholder')}
              rows={3}
              dir="auto"
              className="w-full rounded-lg border border-gray-300 p-4 text-base sm:text-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#4644b8] focus:border-transparent placeholder:text-gray-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSearch()
                }
              }}
            />

            {/* Example chips */}
            <div className="flex flex-wrap gap-2">
              {exampleChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => {
                    setInputText(chip.text)
                    inputRef.current?.focus()
                  }}
                  className="px-3 py-1.5 rounded-full border border-gray-300 text-sm text-gray-600 hover:border-[#4644b8] hover:text-[#4644b8] transition-colors active:bg-[#4644b8]/10"
                >
                  {chip.text}
                </button>
              ))}
            </div>

            <Button
              onClick={handleSearch}
              disabled={isSearching || inputText.trim().length < 2}
              className="w-full h-12 text-base bg-[#4644b8] hover:bg-[#3533a0] text-white"
              size="lg"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin me-2" />
                  {t('searching')}
                </>
              ) : (
                <>
                  <Search className="w-5 h-5 me-2" />
                  {t('searchButton')}
                </>
              )}
            </Button>

            <p className="text-xs text-gray-400 text-center">{t('aiNote')}</p>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Results */}
      {step === 'results' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('search')}
                className="p-1"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div>
                <CardTitle className="text-xl sm:text-2xl text-[#16252d]">
                  {t('step2Title')}
                </CardTitle>
                <CardDescription>{t('step2Subtitle')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {searchError && (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <AlertTriangle className="w-10 h-10 text-amber-500" />
                <p className="text-sm text-gray-600">{searchError}</p>
                <Button
                  onClick={handleSearch}
                  variant="outline"
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  {t('retry')}
                </Button>
              </div>
            )}

            {!searchError && results.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-500 mb-4">{t('noResults')}</p>
                <Button
                  onClick={() => setStep('search')}
                  variant="outline"
                >
                  {t('back')}
                </Button>
              </div>
            )}

            {results.map((occ) => (
              <button
                key={occ.uri}
                type="button"
                onClick={() => handleSelectOccupation(occ)}
                className="w-full text-start rounded-lg border border-gray-200 p-4 hover:border-[#4644b8] hover:bg-[#4644b8]/5 transition-colors active:bg-[#4644b8]/10 focus:outline-none focus:ring-2 focus:ring-[#4644b8]"
              >
                <p className="font-medium text-[#16252d] text-base">
                  {occ.preferredLabel}
                </p>
                {occ.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {occ.description}
                  </p>
                )}
                {occ.altLabels?.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    {t('altLabel')}: {occ.altLabels.slice(0, 3).join(', ')}
                  </p>
                )}
              </button>
            ))}

            {moreResults.length > 0 && (
              <Button
                onClick={handleLoadMore}
                variant="outline"
                className="w-full"
              >
                {t('loadMore')}
              </Button>
            )}

            <Separator />

            <button
              type="button"
              onClick={() => setStep('notListed')}
              className="w-full text-center py-3 text-sm text-gray-500 hover:text-[#4644b8] transition-colors underline underline-offset-2"
            >
              {t('notListed')}
            </button>
          </CardContent>
        </Card>
      )}

      {/* Not Listed */}
      {step === 'notListed' && (
        <NotListedForm
          t={t}
          isSaving={isSaving}
          onSubmit={handleNotListedSubmit}
          onBack={() => setStep('results')}
        />
      )}

      {/* Step 3: Confirm */}
      {step === 'confirm' && selectedOccupation && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('results')}
                className="p-1"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div>
                <CardTitle className="text-xl sm:text-2xl text-[#16252d]">
                  {t('step3Title')}
                </CardTitle>
                <CardDescription>{t('step3Subtitle')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingDetail ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#4644b8]" />
              </div>
            ) : occupationDetail ? (
              <>
                <div className="rounded-lg border border-[#4644b8]/20 bg-[#4644b8]/5 p-4">
                  <h3 className="font-semibold text-lg text-[#16252d]">
                    {occupationDetail.preferredLabel}
                  </h3>
                  {occupationDetail.altLabels.length > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      {t('altLabel')}: {occupationDetail.altLabels.slice(0, 5).join(', ')}
                    </p>
                  )}
                </div>
                {occupationDetail.description && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      {t('occupationDescription')}
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {occupationDetail.description}
                    </p>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    onClick={handleConfirm}
                    className="flex-1 h-12 bg-[#4644b8] hover:bg-[#3533a0] text-white text-base"
                  >
                    <Check className="w-5 h-5 me-2" />
                    {t('confirmOccupation')}
                  </Button>
                  <Button
                    onClick={() => setStep('results')}
                    variant="outline"
                    className="flex-1 h-12 text-base"
                  >
                    {t('changeSelection')}
                  </Button>
                </div>
              </>
            ) : (
              <div className="py-8 text-center">
                <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                <p className="text-sm text-gray-600">{t('escoUnavailable')}</p>
                <Button
                  onClick={() => fetchOccupationDetail(selectedOccupation.uri)}
                  variant="outline"
                  className="mt-3 gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  {t('retry')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 4: Skills */}
      {step === 'skills' && occupationDetail && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('confirm')}
                className="p-1"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div>
                <CardTitle className="text-xl sm:text-2xl text-[#16252d]">
                  {t('step4Title')}
                </CardTitle>
                <CardDescription>{t('step4Subtitle')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-sm font-medium text-[#16252d]">
                {occupationDetail.preferredLabel}
              </p>
            </div>

            {/* Essential Skills */}
            {occupationDetail.essentialSkills.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-[#16252d] mb-3 flex items-center gap-2">
                  <Badge className="bg-[#4644b8] text-white text-xs">
                    {t('essential')}
                  </Badge>
                  {t('essentialSkills')}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {occupationDetail.essentialSkills.map((skill) => (
                    <SkillChip
                      key={skill.uri}
                      label={skill.label}
                      selected={selectedSkillUris.has(skill.uri)}
                      onClick={() => toggleSkill(skill.uri)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Optional Skills */}
            {occupationDetail.optionalSkills.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-[#16252d] mb-3 flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {t('optional')}
                  </Badge>
                  {t('optionalSkills')}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {occupationDetail.optionalSkills.map((skill) => (
                    <SkillChip
                      key={skill.uri}
                      label={skill.label}
                      selected={selectedSkillUris.has(skill.uri)}
                      onClick={() => toggleSkill(skill.uri)}
                    />
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={handleSaveSkills}
              disabled={isSaving || selectedSkillUris.size === 0}
              className="w-full h-12 text-base bg-[#4644b8] hover:bg-[#3533a0] text-white"
              size="lg"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin me-2" />
                  {t('saving')}
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 me-2" />
                  {t('saveSkills')} ({selectedSkillUris.size})
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Saved */}
      {step === 'saved' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl text-[#16252d]">
              {t('step5Title')}
            </CardTitle>
            <CardDescription>{t('step5Summary')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {savedOccupations.map((occ) => (
              <div
                key={occ.id}
                className="rounded-lg border border-gray-200 p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium text-[#16252d]">{occ.preferredLabel}</h4>
                  {occ.isUnmapped && (
                    <Badge variant="outline" className="text-xs shrink-0">
                      Custom
                    </Badge>
                  )}
                </div>
                {occ.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {occ.skills.map((s) => (
                      <Badge
                        key={s.label}
                        variant={s.type === 'essential' ? 'default' : 'outline'}
                        className={
                          s.type === 'essential'
                            ? 'bg-[#4644b8]/10 text-[#4644b8] text-xs'
                            : 'text-xs'
                        }
                      >
                        {s.label}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                onClick={handleAddAnother}
                variant="outline"
                className="flex-1 h-12 text-base gap-2"
              >
                <Plus className="w-5 h-5" />
                {t('addAnother')}
              </Button>
              <Button
                onClick={() => toast.success(t('finish'))}
                className="flex-1 h-12 text-base bg-[#4644b8] hover:bg-[#3533a0] text-white"
              >
                {t('finish')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attribution footer */}
      <p className="text-xs text-gray-400 text-center px-4">{t('attribution')}</p>
    </div>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────

function SkillChip({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#4644b8] ${
        selected
          ? 'border-[#4644b8] bg-[#4644b8]/10 text-[#4644b8] font-medium'
          : 'border-gray-300 text-gray-600 hover:border-gray-400 active:bg-gray-100'
      }`}
    >
      {selected && <Check className="w-3.5 h-3.5" />}
      {label}
    </button>
  )
}

function NotListedForm({
  t,
  isSaving,
  onSubmit,
  onBack,
}: {
  t: (key: string) => string
  isSaving: boolean
  onSubmit: (title: string) => void
  onBack: () => void
}) {
  const [customTitle, setCustomTitle] = useState('')

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack} className="p-1">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <CardTitle className="text-xl sm:text-2xl text-[#16252d]">
            {t('notListedTitle')}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          type="text"
          value={customTitle}
          onChange={(e) => setCustomTitle(e.target.value)}
          placeholder={t('notListedPlaceholder')}
          dir="auto"
          className="w-full rounded-lg border border-gray-300 p-4 text-base focus:outline-none focus:ring-2 focus:ring-[#4644b8] focus:border-transparent"
        />
        <Button
          onClick={() => onSubmit(customTitle)}
          disabled={isSaving || !customTitle.trim()}
          className="w-full h-12 text-base bg-[#4644b8] hover:bg-[#3533a0] text-white"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin me-2" />
              {t('saving')}
            </>
          ) : (
            t('notListedSubmit')
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
