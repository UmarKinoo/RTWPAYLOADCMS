'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { ChevronLeft, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { getFallbackTemplate, getUniversalQuestions, isUniversalDuplicate } from '@/lib/esco/qualification/fallback'
import type {
  QualificationQuestion,
  QualificationTemplateResponse,
  QuestionCategory,
} from '@/lib/esco/qualification/schema'

/**
 * Categories fully covered by the universal / registration basics.
 * AI questions in these categories are dropped to avoid repeats.
 * Note: `licence` is NOT listed — AI may still ask occupation licences
 * (forklift, welding, heavy vehicle); only visa duplicates are filtered by topic.
 */
const UNIVERSAL_CATEGORIES = new Set<QuestionCategory>([
  'experience',
  'availability',
  'verification',
])

export type AnswerMap = Record<string, string | string[] | boolean | number>

/** Client-side conditional visibility (mirrors server validate.isQuestionVisible). */
function isQuestionVisible(
  question: QualificationQuestion,
  answers: Record<string, unknown>,
): boolean {
  if (!question.showWhen) return true
  const { questionId, operator, value } = question.showWhen
  const answer = answers[questionId]
  if (answer === undefined || answer === null) return false
  if (operator === 'equals') return answer === value
  if (operator === 'not_equals') return answer !== value
  if (operator === 'includes') {
    if (Array.isArray(answer)) return answer.includes(value)
    return String(answer) === String(value)
  }
  return false
}

interface Props {
  template: QualificationTemplateResponse | null
  loading: boolean
  occupationLabel: string
  sessionId: string
  occupationUri: string
  candidateOccupationId: string
  onComplete: (answers: AnswerMap, template: QualificationTemplateResponse) => void
  onBack: () => void
}

function storageKey(sessionId: string, occupationUri: string) {
  return `esco-qual-answers:${sessionId}:${occupationUri}`
}

function formatAnswerDisplay(answer: unknown, t: (key: string) => string): string {
  if (typeof answer === 'boolean') return answer ? t('yes') : t('no')
  if (Array.isArray(answer)) return answer.join(', ')
  if (answer === null || answer === undefined || answer === '') return '—'
  return String(answer)
}

export function QualificationForm({
  template,
  loading,
  occupationLabel,
  sessionId,
  occupationUri,
  candidateOccupationId,
  onComplete,
  onBack,
}: Props) {
  const t = useTranslations('demoCandReg.qualification')
  const locale = useLocale()
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<'questions' | 'waiting' | 'review'>('questions')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Restore autosaved answers
  useEffect(() => {
    if (!sessionId || !occupationUri) return
    try {
      const raw = localStorage.getItem(storageKey(sessionId, occupationUri))
      if (raw) setAnswers(JSON.parse(raw))
    } catch {
      // ignore
    }
  }, [sessionId, occupationUri])

  // Autosave
  useEffect(() => {
    if (!sessionId || !occupationUri || Object.keys(answers).length === 0) return
    localStorage.setItem(storageKey(sessionId, occupationUri), JSON.stringify(answers))
  }, [answers, sessionId, occupationUri])

  // Universal basics shown immediately (no AI needed) while generation runs.
  const universalQuestions = useMemo(() => getUniversalQuestions(locale), [locale])

  // Occupation-specific questions from the AI template, minus anything the
  // universal / registration basics already cover (ids, categories, topics).
  const specificQuestions = useMemo(() => {
    if (!template || template.source === 'fallback') return []
    const universalIds = new Set(universalQuestions.map((q) => q.id))
    const kept = template.questions.filter(
      (q) =>
        !universalIds.has(q.id) &&
        !UNIVERSAL_CATEGORIES.has(q.category) &&
        !isUniversalDuplicate(q),
    )
    // Re-add conditional parents that were filtered out, so showWhen rules resolve
    let added = true
    while (added) {
      added = false
      for (const q of kept) {
        const ref = q.showWhen?.questionId
        if (ref && !universalIds.has(ref) && !kept.some((k) => k.id === ref)) {
          const parent = template.questions.find((x) => x.id === ref)
          if (parent && !isUniversalDuplicate(parent)) {
            kept.splice(kept.indexOf(q), 0, parent)
            added = true
            break
          }
        }
      }
    }
    return kept
  }, [template, universalQuestions])

  const allQuestions = useMemo(
    () => [...universalQuestions, ...specificQuestions],
    [universalQuestions, specificQuestions],
  )

  // The template as seen by the review/summary screens: universal basics plus
  // whatever occupation-specific questions arrived.
  const effectiveTemplate = useMemo<QualificationTemplateResponse>(() => {
    const base = template ?? getFallbackTemplate(occupationUri, occupationLabel, locale)
    return { ...base, questions: allQuestions }
  }, [template, occupationUri, occupationLabel, locale, allQuestions])

  const visibleQuestions = useMemo(
    () => allQuestions.filter((q) => isQuestionVisible(q, answers)),
    [allQuestions, answers],
  )

  // Keep index in range when conditionals change
  useEffect(() => {
    if (index >= visibleQuestions.length && visibleQuestions.length > 0) {
      setIndex(visibleQuestions.length - 1)
    }
  }, [visibleQuestions.length, index])

  const current = visibleQuestions[index]
  const progressPct =
    visibleQuestions.length > 0
      ? Math.round(((Math.min(index, visibleQuestions.length - 1) + 1) / visibleQuestions.length) * 100)
      : 0

  const setAnswer = useCallback((questionId: string, value: AnswerMap[string]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
    setError(null)
  }, [])

  const toggleMulti = useCallback((questionId: string, option: string) => {
    setAnswers((prev) => {
      const current = Array.isArray(prev[questionId]) ? (prev[questionId] as string[]) : []
      const next = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option]
      return { ...prev, [questionId]: next }
    })
    setError(null)
  }, [])

  const isAnswered = useCallback(
    (q: QualificationQuestion): boolean => {
      const a = answers[q.id]
      if (a === undefined || a === null) return false
      if (typeof a === 'string') return a.trim().length > 0
      if (typeof a === 'boolean') return true
      if (typeof a === 'number') return true
      if (Array.isArray(a)) return a.length > 0
      return false
    },
    [answers],
  )

  const handleNext = useCallback(() => {
    if (!current) return
    if (current.required && !isAnswered(current)) {
      setError(t('answerRequired'))
      return
    }
    if (index < visibleQuestions.length - 1) {
      setIndex(index + 1)
    } else if (loading) {
      // Finished the basics before the AI did — brief wait for specific questions
      setMode('waiting')
    } else {
      setMode('review')
    }
  }, [current, index, visibleQuestions.length, isAnswered, loading, t])

  // Leave the waiting screen as soon as generation settles (success or failure)
  useEffect(() => {
    if (mode !== 'waiting' || loading) return
    if (index < visibleQuestions.length - 1) {
      setIndex(index + 1)
      setMode('questions')
    } else {
      setMode('review')
    }
  }, [mode, loading, visibleQuestions.length, index])

  const handlePrevious = useCallback(() => {
    if (mode === 'review' || mode === 'waiting') {
      setMode('questions')
      return
    }
    if (index > 0) setIndex(index - 1)
    else onBack()
  }, [mode, index, onBack])

  const handleSubmit = useCallback(async () => {
    setSubmitting(true)
    setError(null)
    try {
      // Drop answers for questions that are no longer visible
      const visibleIds = new Set(visibleQuestions.map((q) => q.id))
      const payloadAnswers = Object.entries(answers)
        .filter(([id]) => visibleIds.has(id))
        .map(([questionId, answer]) => ({ questionId, answer }))

      const res = await fetch('/api/demo-cand-reg/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          candidateOccupationId,
          templateId: template?.templateId ?? null,
          answers: payloadAnswers,
        }),
      })
      if (!res.ok) throw new Error()

      localStorage.removeItem(storageKey(sessionId, occupationUri))
      onComplete(answers, effectiveTemplate)
    } catch {
      setError('Failed to save answers. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }, [
    template,
    effectiveTemplate,
    visibleQuestions,
    answers,
    sessionId,
    candidateOccupationId,
    occupationUri,
    onComplete,
  ])

  // ─── Waiting for occupation-specific questions ───────────────────
  if (mode === 'waiting') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#4644b8]" />
          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-[#16252d]">{t('preparingSpecific')}</p>
            <p className="text-xs text-gray-500">{t('waitingHint')}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button variant="outline" onClick={handlePrevious} className="gap-2">
              <ChevronLeft className="w-4 h-4" />
              {t('previous')}
            </Button>
            <Button variant="ghost" onClick={() => setMode('review')} className="text-gray-500">
              {t('skipWaiting')}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ─── Review screen ───────────────────────────────────────────────
  if (mode === 'review') {
    const byCategory = new Map<QuestionCategory, QualificationQuestion[]>()
    for (const q of visibleQuestions) {
      const list = byCategory.get(q.category) ?? []
      list.push(q)
      byCategory.set(q.category, list)
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl text-[#16252d]">{t('reviewTitle')}</CardTitle>
          <CardDescription>
            {occupationLabel} — {t('reviewSubtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {Array.from(byCategory.entries()).map(([category, qs]) => (
            <div key={category} className="space-y-3">
              <h4 className="text-sm font-semibold text-[#4644b8]">
                {t(`categories.${category}`)}
              </h4>
              {qs.map((q) => (
                <div
                  key={q.id}
                  className="rounded-lg border border-gray-200 p-3 flex justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-gray-500">{q.label}</p>
                    <p className="font-medium text-[#16252d] mt-0.5 break-words">
                      {formatAnswerDisplay(answers[q.id], t)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-xs text-[#4644b8] underline shrink-0 self-start"
                    onClick={() => {
                      const i = visibleQuestions.findIndex((x) => x.id === q.id)
                      if (i >= 0) {
                        setIndex(i)
                        setMode('questions')
                      }
                    }}
                  >
                    {t('edit')}
                  </button>
                </div>
              ))}
            </div>
          ))}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button variant="outline" onClick={handlePrevious} className="flex-1 h-12">
              <ChevronLeft className="w-5 h-5 me-1" />
              {t('previous')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 h-12 bg-[#4644b8] hover:bg-[#3533a0] text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin me-2" />
                  {t('submitting')}
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 me-2" />
                  {t('submit')}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ─── Question screen ─────────────────────────────────────────────
  if (!current) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-gray-500">
          No questions available.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-xl sm:text-2xl text-[#16252d]">{t('title')}</CardTitle>
          <Badge variant="outline" className="text-xs shrink-0">
            {t('progress', { current: index + 1, total: visibleQuestions.length })}
          </Badge>
        </div>
        <Progress value={progressPct} className="h-2" />
        {loading && (
          <p className="text-xs text-gray-500 flex items-center gap-1.5">
            <Loader2 className="w-3 h-3 animate-spin shrink-0" />
            {t('moreComing')}
          </p>
        )}
        <CardDescription>{t('subtitle')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-2">
          <Badge className="bg-[#4644b8]/10 text-[#4644b8] text-xs">
            {t(`categories.${current.category}`)}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {current.required ? t('required') : t('optional')}
          </Badge>
        </div>

        <h3 className="text-lg font-medium text-[#16252d] leading-snug">{current.label}</h3>

        <QuestionInput
          question={current}
          answer={answers[current.id]}
          onChange={(v) => setAnswer(current.id, v)}
          onToggleMulti={(opt) => toggleMulti(current.id, opt)}
          t={t}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
          <Button variant="outline" onClick={handlePrevious} className="flex-1 h-12">
            <ChevronLeft className="w-5 h-5 me-1" />
            {t('previous')}
          </Button>
          <Button
            onClick={handleNext}
            className="flex-1 h-12 bg-[#4644b8] hover:bg-[#3533a0] text-white"
          >
            {index < visibleQuestions.length - 1 || loading ? t('next') : t('reviewTitle')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Question input by type ─────────────────────────────────────────

function QuestionInput({
  question,
  answer,
  onChange,
  onToggleMulti,
  t,
}: {
  question: QualificationQuestion
  answer: AnswerMap[string] | undefined
  onChange: (v: AnswerMap[string]) => void
  onToggleMulti: (option: string) => void
  t: (key: string) => string
}) {
  if (question.type === 'yes_no') {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[true, false].map((val) => {
          const selected = answer === val
          return (
            <button
              key={String(val)}
              type="button"
              onClick={() => onChange(val)}
              className={`h-14 rounded-xl border-2 text-base font-medium transition-colors ${
                selected
                  ? 'border-[#4644b8] bg-[#4644b8]/10 text-[#4644b8]'
                  : 'border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
            >
              {val ? t('yes') : t('no')}
            </button>
          )
        })}
      </div>
    )
  }

  if (question.type === 'single_select' || question.type === 'number_range') {
    return (
      <div className="space-y-2">
        <p className="text-xs text-gray-400">{t('selectOne')}</p>
        <div className="flex flex-col gap-2">
          {(question.options ?? []).map((opt) => {
            const selected = answer === opt
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onChange(opt)}
                className={`w-full text-start rounded-xl border-2 px-4 py-3.5 text-base transition-colors ${
                  selected
                    ? 'border-[#4644b8] bg-[#4644b8]/10 text-[#4644b8] font-medium'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                {selected && <Check className="w-4 h-4 inline me-2" />}
                {opt}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (question.type === 'multi_select') {
    const selected = Array.isArray(answer) ? answer : []
    return (
      <div className="space-y-2">
        <p className="text-xs text-gray-400">{t('selectAll')}</p>
        <div className="flex flex-wrap gap-2">
          {(question.options ?? []).map((opt) => {
            const on = selected.includes(opt)
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onToggleMulti(opt)}
                className={`inline-flex items-center gap-1.5 px-3 py-2.5 rounded-full border text-sm transition-colors ${
                  on
                    ? 'border-[#4644b8] bg-[#4644b8]/10 text-[#4644b8] font-medium'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                {on && <Check className="w-3.5 h-3.5" />}
                {opt}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (question.type === 'date') {
    return (
      <div>
        <p className="text-xs text-gray-400 mb-2">{t('enterDate')}</p>
        <input
          type="date"
          value={typeof answer === 'string' ? answer : ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border-2 border-gray-300 p-4 text-base focus:outline-none focus:ring-2 focus:ring-[#4644b8] focus:border-transparent"
        />
      </div>
    )
  }

  // short_text
  return (
    <div>
      <p className="text-xs text-gray-400 mb-2">{t('enterText')}</p>
      <input
        type="text"
        value={typeof answer === 'string' ? answer : ''}
        onChange={(e) => onChange(e.target.value)}
        dir="auto"
        maxLength={200}
        className="w-full rounded-xl border-2 border-gray-300 p-4 text-base focus:outline-none focus:ring-2 focus:ring-[#4644b8] focus:border-transparent"
      />
    </div>
  )
}
