'use client'

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { useForm, type Control, type FieldErrors, type UseFormRegister, type UseFormSetValue } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import {
  Search,
  ChevronLeft,
  ChevronRight,
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
import {
  QualificationForm,
  type AnswerMap,
} from '@/components/demo-cand-reg/QualificationForm'
import type { QualificationTemplateResponse } from '@/lib/esco/qualification/schema'
import { validatePassword, validateEmail } from '@/lib/validation'
import { AccountStep } from '@/components/candidate/wizard-steps/AccountStep'
import { PersonalInfoStep } from '@/components/candidate/wizard-steps/PersonalInfoStep'
import { JobRoleStep } from '@/components/candidate/wizard-steps/JobRoleStep'
import { ReviewStep } from '@/components/candidate/wizard-steps/ReviewStep'
import { PhoneVerification } from '@/components/auth/phone-verification'
import type { CandidateFormData } from '@/components/candidate/RegistrationWizard'
import { registerDemoCandidate } from '@/lib/demo-candidate'
import { mapUniversalAnswers } from '@/lib/esco/qualification/mapToCandidate'
import { useFormDraft } from '@/hooks/useFormDraft'

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
  qualificationAnswers?: AnswerMap
  qualificationTemplate?: QualificationTemplateResponse | null
}

type Step =
  | 'account'
  | 'personal'
  | 'search'
  | 'results'
  | 'confirm'
  | 'skills'
  | 'qualify'
  | 'saved'
  | 'notListed'
  | 'jobRole'
  | 'review'
  | 'verify'

// ─── Registration form (account + personal + job role + consents) ──
// Work/visa/availability fields come from qualification answers.

const demoRegistrationSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    phone: z.string().min(1, 'Phone number is required'),
    whatsapp: z.string().optional(),
    sameAsPhone: z.boolean().optional(),
    gender: z.enum(['male', 'female'], { message: 'Gender is required' }),
    dob: z.string().min(1, 'Date of birth is required'),
    nationality: z.string().min(1, 'Nationality is required'),
    languages: z.string().min(1, 'Languages are required'),
    currentlyInKSA: z.boolean().refine((val) => val === true, {
      message: 'Please confirm you are currently located in Saudi Arabia',
    }),
    location: z.string().min(1, 'Location is required'),
    primarySkill: z.string().min(1, 'Please select your job role'),
    secondarySkill: z.string().optional(),
    tertiarySkill: z.string().optional(),
    acceptPrivacyTerms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the Privacy Policy and Terms and Conditions',
    }),
    acceptDataConsent: z.boolean().refine((val) => val === true, {
      message: 'You must consent to data collection and publication',
    }),
    acceptPlatformDisclaimer: z.boolean().refine((val) => val === true, {
      message: 'You must acknowledge the platform disclaimer',
    }),
  })
  .refine((data) => validatePassword(data.password).valid, {
    message:
      'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
    path: ['password'],
  })
  .refine((data) => validateEmail(data.email).valid, {
    message: 'Invalid email address',
    path: ['email'],
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => (data.phone || '').startsWith('+966'), {
    message: 'Only Saudi Arabia (KSA) phone numbers are accepted. Use +966...',
    path: ['phone'],
  })
  .refine((data) => !data.secondarySkill || data.secondarySkill !== data.primarySkill, {
    message: 'Secondary skill must be different from your primary skill',
    path: ['secondarySkill'],
  })
  .refine((data) => !data.tertiarySkill || data.tertiarySkill !== data.primarySkill, {
    message: 'Third skill must be different from your primary skill',
    path: ['tertiarySkill'],
  })
  .refine(
    (data) =>
      !data.tertiarySkill || !data.secondarySkill || data.tertiarySkill !== data.secondarySkill,
    {
      message: 'Third skill must be different from your second skill',
      path: ['tertiarySkill'],
    },
  )

type DemoFormData = z.infer<typeof demoRegistrationSchema>

interface DemoRegistrationDraft {
  values: Partial<DemoFormData>
}

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

function clearSessionStorage() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('esco-demo-session-id')
  localStorage.removeItem('esco-demo-input')
}

// ─── Component ──────────────────────────────────────────────────────

export function EscoWizard() {
  const t = useTranslations('demoCandReg')
  const tReg = useTranslations('registration')
  const locale = useLocale()
  const router = useRouter()

  const [step, setStep] = useState<Step>('account')
  const [inputText, setInputText] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [results, setResults] = useState<OccupationResult[]>([])
  const [moreResults, setMoreResults] = useState<OccupationResult[]>([])
  const [searchLogId, setSearchLogId] = useState<string | null>(null)
  const [selectedOccupation, setSelectedOccupation] = useState<OccupationResult | null>(null)
  const [occupationDetail, setOccupationDetail] = useState<OccupationDetail | null>(null)
  const [selectedSkillUris, setSelectedSkillUris] = useState<Set<string>>(new Set())
  const [savedOccupations, setSavedOccupations] = useState<SavedOccupation[]>([])
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [qualificationTemplate, setQualificationTemplate] =
    useState<QualificationTemplateResponse | null>(null)
  const [loadingQualification, setLoadingQualification] = useState(false)
  const [pendingOccupationId, setPendingOccupationId] = useState<string | null>(null)
  const [pendingSkills, setPendingSkills] = useState<
    Array<{ label: string; type: 'essential' | 'optional' }>
  >([])
  const [sameAsPhone, setSameAsPhone] = useState(false)
  const [candidateId, setCandidateId] = useState<string | null>(null)
  const [registrationSnapshot, setRegistrationSnapshot] = useState<DemoFormData | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const qualificationPrefetchRef = useRef<string | null>(null)
  const draftRestoredRef = useRef(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    trigger,
    clearErrors,
    formState: { errors },
  } = useForm<DemoFormData>({
    resolver: zodResolver(demoRegistrationSchema),
    mode: 'onChange',
    defaultValues: {
      sameAsPhone: false,
      currentlyInKSA: false,
      acceptPrivacyTerms: false,
      acceptDataConsent: false,
      acceptPlatformDisclaimer: false,
    },
  })

  const phone = watch('phone')
  const primarySkill = watch('primarySkill')
  const secondarySkill = watch('secondarySkill')
  const tertiarySkill = watch('tertiarySkill')
  const password = watch('password')
  const confirmPassword = watch('confirmPassword')
  const formValues = watch()

  const { loadDraft, saveDraft, clearDraft } = useFormDraft<DemoRegistrationDraft>(
    'demo-cand-reg',
  )

  // Cast helpers — wizard step components are typed against the full CandidateFormData
  const registerAs = register as unknown as UseFormRegister<CandidateFormData>
  const controlAs = control as unknown as Control<CandidateFormData>
  const errorsAs = errors as unknown as FieldErrors<CandidateFormData>
  const setValueAs = setValue as unknown as UseFormSetValue<CandidateFormData>

  // Restore draft (never restores passwords / consents)
  useEffect(() => {
    if (draftRestoredRef.current) return
    draftRestoredRef.current = true
    const draft = loadDraft()
    if (!draft?.values) return
    const values = draft.values
    const hasContent = Boolean(values.email || values.firstName || values.phone)
    if (!hasContent) return
    Object.entries(values).forEach(([field, value]) => {
      if (value !== undefined && value !== null) {
        setValue(field as keyof DemoFormData, value as never, { shouldValidate: false })
      }
    })
    if (values.sameAsPhone) setSameAsPhone(true)
    toast.info(tReg('draftRestored'))
  }, [loadDraft, setValue, tReg])

  // Persist safe form values
  useEffect(() => {
    if (step === 'verify' || isRegistering) return
    const {
      password: _p,
      confirmPassword: _c,
      acceptPrivacyTerms: _a1,
      acceptDataConsent: _a2,
      acceptPlatformDisclaimer: _a3,
      ...safeValues
    } = formValues
    const hasContent = Boolean(
      safeValues.email || safeValues.firstName || safeValues.phone || safeValues.primarySkill,
    )
    if (!hasContent) return
    saveDraft({ values: safeValues })
  }, [formValues, step, isRegistering, saveDraft])

  useEffect(() => {
    if (sameAsPhone && phone) setValue('whatsapp', phone)
  }, [sameAsPhone, phone, setValue])

  useEffect(() => {
    if (step !== 'review') {
      clearErrors(['acceptPrivacyTerms', 'acceptDataConsent', 'acceptPlatformDisclaimer'])
    }
  }, [step, clearErrors])

  useEffect(() => {
    if (step !== 'personal') clearErrors(['currentlyInKSA'])
  }, [step, clearErrors])

  // Persist occupation search input
  useEffect(() => {
    const saved = localStorage.getItem('esco-demo-input')
    if (saved) setInputText(saved)
  }, [])
  useEffect(() => {
    if (inputText) localStorage.setItem('esco-demo-input', inputText)
  }, [inputText])

  const passwordsMatch = password && confirmPassword ? password === confirmPassword : true

  // Merged universal answers from the first occupation that has them
  const mergedAnswers = useMemo(() => {
    for (const occ of savedOccupations) {
      if (occ.qualificationAnswers && Object.keys(occ.qualificationAnswers).length > 0) {
        return occ.qualificationAnswers
      }
    }
    return {} as AnswerMap
  }, [savedOccupations])

  const mappedFields = useMemo(() => mapUniversalAnswers(mergedAnswers), [mergedAnswers])

  // Form values enriched for ReviewStep display (job title / experience / visa)
  const reviewFormValues = useMemo((): Partial<CandidateFormData> => {
    return {
      ...(formValues as Partial<CandidateFormData>),
      jobTitle: savedOccupations[0]?.preferredLabel || '',
      experienceYears: mappedFields.experienceYears,
      saudiExperience: mappedFields.saudiExperience,
      currentEmployer: mappedFields.currentEmployer,
      availabilityDate: mappedFields.availabilityDate,
      visaStatus: mappedFields.visaStatus,
      visaExpiry: mappedFields.visaExpiry,
      visaProfession: mappedFields.visaProfession,
      industryExperience: savedOccupations.map((o) => o.preferredLabel).join(', '),
    }
  }, [formValues, savedOccupations, mappedFields])

  // ─── Step navigation ────────────────────────────────────────────

  const goAccountNext = async () => {
    const ok = await trigger(['email', 'password', 'confirmPassword'])
    if (!ok || !passwordsMatch) {
      toast.error(t('validationError'), {
        description: !passwordsMatch ? t('passwordsMustMatch') : undefined,
      })
      return
    }
    setStep('personal')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goPersonalNext = async () => {
    const ok = await trigger([
      'firstName',
      'lastName',
      'phone',
      'whatsapp',
      'gender',
      'dob',
      'nationality',
      'languages',
      'location',
      'currentlyInKSA',
    ])
    if (!ok) {
      toast.error(t('validationError'))
      return
    }
    setStep('search')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goJobRoleNext = async () => {
    const ok = await trigger(['primarySkill', 'secondarySkill', 'tertiarySkill'])
    if (!ok) {
      toast.error(t('validationError'))
      return
    }
    setStep('review')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleEditFromReview = (wizardStep: number) => {
    if (wizardStep === 1) setStep('account')
    else if (wizardStep === 2) setStep('personal')
    else if (wizardStep === 3) setStep('jobRole')
    else setStep('saved')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ─── Registration ───────────────────────────────────────────────

  const onRegister = async (data: DemoFormData) => {
    if (savedOccupations.length === 0) {
      toast.error(t('needOccupation'))
      setStep('search')
      return
    }
    setIsRegistering(true)
    try {
      const result = await registerDemoCandidate({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        phone: data.phone,
        whatsapp: sameAsPhone ? data.phone : data.whatsapp || data.phone,
        gender: data.gender,
        dob: data.dob,
        nationality: data.nationality,
        languages: data.languages,
        location: data.location,
        primarySkill: data.primarySkill,
        secondarySkill: data.secondarySkill,
        tertiarySkill: data.tertiarySkill,
        sessionId: getSessionId(),
        jobTitle: savedOccupations[0].preferredLabel,
        answers: mergedAnswers,
        termsAccepted: true,
      })

      if (result.success && result.candidateId) {
        clearDraft()
        toast.success(t('registrationSuccess'), {
          description: t('verifyPhoneHint'),
        })
        setCandidateId(result.candidateId)
        setRegistrationSnapshot(data)
        setStep('verify')
      } else {
        toast.error(tReg('registrationFailed'), {
          description: result.error || tReg('pleaseTryAgainLater'),
        })
      }
    } catch (error) {
      console.error('Demo registration error:', error)
      toast.error(tReg('registrationFailed'), {
        description: error instanceof Error ? error.message : tReg('somethingWentWrong'),
      })
    } finally {
      setIsRegistering(false)
    }
  }

  const handleRegisterSubmit = handleSubmit(onRegister, (formErrors) => {
    const first = Object.values(formErrors)[0] as { message?: string } | undefined
    toast.error(t('validationError'), { description: first?.message })
  })

  // ─── ESCO API Calls ─────────────────────────────────────────────

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

  const prefetchQualification = useCallback(
    async (uri: string) => {
      if (qualificationPrefetchRef.current === uri && qualificationTemplate) return
      qualificationPrefetchRef.current = uri
      setLoadingQualification(true)
      setQualificationTemplate(null)
      try {
        const res = await fetch('/api/esco/qualification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ escoUri: uri, language: locale }),
        })
        if (!res.ok) throw new Error()
        const data = await res.json()
        setQualificationTemplate(data.template)
      } catch {
        setQualificationTemplate(null)
        qualificationPrefetchRef.current = null
      } finally {
        setLoadingQualification(false)
      }
    },
    [locale, qualificationTemplate],
  )

  const handleConfirm = useCallback(() => {
    if (!occupationDetail) return
    const essentialUris = new Set(occupationDetail.essentialSkills.map((s) => s.uri))
    setSelectedSkillUris(essentialUris)
    prefetchQualification(occupationDetail.uri)
    setStep('skills')
  }, [occupationDetail, prefetchQualification])

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

      setPendingOccupationId(data.occupationId)
      setPendingSkills(selectedSkills.map((s) => ({ label: s.skillLabel, type: s.skillType })))

      if (!qualificationTemplate && selectedOccupation.uri) {
        prefetchQualification(selectedOccupation.uri)
      }
      setStep('qualify')
    } catch {
      toast.error('Failed to save. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }, [
    occupationDetail,
    selectedOccupation,
    selectedSkillUris,
    locale,
    inputText,
    searchLogId,
    t,
    qualificationTemplate,
    prefetchQualification,
  ])

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

  const handleQualificationComplete = useCallback(
    (answers: AnswerMap, template: QualificationTemplateResponse) => {
      if (!selectedOccupation || !pendingOccupationId) return
      setSavedOccupations((prev) => [
        ...prev,
        {
          id: pendingOccupationId,
          preferredLabel: selectedOccupation.preferredLabel,
          escoUri: selectedOccupation.uri,
          skills: pendingSkills,
          isUnmapped: false,
          qualificationAnswers: answers,
          qualificationTemplate: template,
        },
      ])
      setPendingOccupationId(null)
      setPendingSkills([])
      toast.success(t('step5Title'))
      setStep('saved')
    },
    [selectedOccupation, pendingOccupationId, pendingSkills, t],
  )

  const handleAddAnother = useCallback(() => {
    setInputText('')
    setResults([])
    setMoreResults([])
    setSelectedOccupation(null)
    setOccupationDetail(null)
    setSelectedSkillUris(new Set())
    setSearchError(null)
    setQualificationTemplate(null)
    setPendingOccupationId(null)
    setPendingSkills([])
    qualificationPrefetchRef.current = null
    setStep('search')
    localStorage.removeItem('esco-demo-input')
  }, [])

  const handleLoadMore = useCallback(() => {
    setResults((prev) => [...prev, ...moreResults.slice(0, 8)])
    setMoreResults((prev) => prev.slice(8))
  }, [moreResults])

  const exampleChips = [
    { key: 'acWorker', text: t('exampleChips.acWorker') },
    { key: 'driver', text: t('exampleChips.driver') },
    { key: 'housekeeper', text: t('exampleChips.housekeeper') },
    { key: 'electrician', text: t('exampleChips.electrician') },
    { key: 'warehouse', text: t('exampleChips.warehouse') },
    { key: 'cook', text: t('exampleChips.cook') },
  ]

  // ─── Phone verification screen ──────────────────────────────────

  if (step === 'verify' && candidateId && registrationSnapshot) {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl text-[#16252d]">
              {t('verifyPhoneTitle')}
            </CardTitle>
            <CardDescription>{t('verifyPhoneSubtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <PhoneVerification
              phone={registrationSnapshot.phone}
              userId={candidateId}
              userCollection="candidates"
              onVerified={async () => {
                toast.success(t('phoneVerified'))
                try {
                  const { loginUser } = await import('@/lib/auth')
                  const loginResult = await loginUser({
                    email: registrationSnapshot.email,
                    password: registrationSnapshot.password,
                    collection: 'candidates',
                  })
                  clearSessionStorage()
                  if (loginResult.success) {
                    router.push('/dashboard')
                    router.refresh()
                  } else {
                    toast.error(t('loginAfterVerifyFailed'))
                    router.push('/login')
                  }
                } catch (error) {
                  console.error('Error logging in after verification:', error)
                  toast.error(t('loginAfterVerifyFailed'))
                  router.push('/login')
                }
              }}
            />
          </CardContent>
        </Card>
        <p className="text-xs text-gray-400 text-center px-4">{t('attribution')}</p>
      </div>
    )
  }

  // ─── Render Steps ───────────────────────────────────────────────

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Saved occupations banner */}
      {savedOccupations.length > 0 && step !== 'saved' && step !== 'review' && step !== 'jobRole' && (
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

      {/* Account */}
      {step === 'account' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl text-[#16252d]">
              {t('accountTitle')}
            </CardTitle>
            <CardDescription>{t('accountSubtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <AccountStep register={registerAs} errors={errorsAs} control={controlAs} />
            <Button
              onClick={goAccountNext}
              disabled={!passwordsMatch}
              className="w-full h-12 text-base bg-[#4644b8] hover:bg-[#3533a0] text-white"
            >
              {t('continue')}
              <ChevronRight className="w-5 h-5 ms-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Personal */}
      {step === 'personal' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('account')}
                className="p-1"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div>
                <CardTitle className="text-xl sm:text-2xl text-[#16252d]">
                  {t('personalTitle')}
                </CardTitle>
                <CardDescription>{t('personalSubtitle')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <PersonalInfoStep
              register={registerAs}
              errors={errorsAs}
              control={controlAs}
              sameAsPhone={sameAsPhone}
              setSameAsPhone={setSameAsPhone}
              phone={phone || ''}
              setValue={setValueAs}
            />
            <Button
              onClick={goPersonalNext}
              className="w-full h-12 text-base bg-[#4644b8] hover:bg-[#3533a0] text-white"
            >
              {t('continueToOccupations')}
              <ChevronRight className="w-5 h-5 ms-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      {step === 'search' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('personal')}
                className="p-1"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div>
                <CardTitle className="text-xl sm:text-2xl text-[#16252d]">
                  {t('step1Title')}
                </CardTitle>
                <CardDescription>{t('step1Hint')}</CardDescription>
              </div>
            </div>
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

      {/* Results */}
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
                <Button onClick={handleSearch} variant="outline" className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  {t('retry')}
                </Button>
              </div>
            )}

            {!searchError && results.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-500 mb-4">{t('noResults')}</p>
                <Button onClick={() => setStep('search')} variant="outline">
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
                <p className="font-medium text-[#16252d] text-base">{occ.preferredLabel}</p>
                {occ.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{occ.description}</p>
                )}
                {occ.altLabels?.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    {t('altLabel')}: {occ.altLabels.slice(0, 3).join(', ')}
                  </p>
                )}
              </button>
            ))}

            {moreResults.length > 0 && (
              <Button onClick={handleLoadMore} variant="outline" className="w-full">
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

      {/* Confirm */}
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

      {/* Skills */}
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

            {occupationDetail.essentialSkills.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-[#16252d] mb-3 flex items-center gap-2">
                  <Badge className="bg-[#4644b8] text-white text-xs">{t('essential')}</Badge>
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

      {/* Qualification */}
      {step === 'qualify' && selectedOccupation && pendingOccupationId && (
        <QualificationForm
          template={qualificationTemplate}
          loading={loadingQualification}
          occupationLabel={selectedOccupation.preferredLabel}
          sessionId={getSessionId()}
          occupationUri={selectedOccupation.uri}
          candidateOccupationId={pendingOccupationId}
          onComplete={handleQualificationComplete}
          onBack={() => setStep('skills')}
        />
      )}

      {/* Saved / Summary */}
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
                className="rounded-lg border border-gray-200 p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium text-[#16252d] text-lg">{occ.preferredLabel}</h4>
                  {occ.isUnmapped && (
                    <Badge variant="outline" className="text-xs shrink-0">
                      Custom
                    </Badge>
                  )}
                </div>
                {occ.skills.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1.5">{t('skills')}</p>
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
                  </div>
                )}
                {occ.qualificationTemplate && occ.qualificationAnswers && (
                  <QualificationSummary
                    template={occ.qualificationTemplate}
                    answers={occ.qualificationAnswers}
                  />
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
                onClick={() => {
                  setStep('jobRole')
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="flex-1 h-12 text-base bg-[#4644b8] hover:bg-[#3533a0] text-white"
              >
                {t('continueToJobRole')}
                <ChevronRight className="w-5 h-5 ms-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Job role (Smart Matrix primarySkill) */}
      {step === 'jobRole' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('saved')}
                className="p-1"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div>
                <CardTitle className="text-xl sm:text-2xl text-[#16252d]">
                  {t('jobRoleTitle')}
                </CardTitle>
                <CardDescription>
                  {t('jobRoleSubtitle', {
                    occupation: savedOccupations[0]?.preferredLabel || '',
                  })}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <JobRoleStep
              primarySkill={primarySkill || ''}
              secondarySkill={secondarySkill}
              tertiarySkill={tertiarySkill}
              setValue={setValueAs}
              errors={errorsAs}
            />
            <Button
              onClick={goJobRoleNext}
              className="w-full h-12 text-base bg-[#4644b8] hover:bg-[#3533a0] text-white"
            >
              {t('continue')}
              <ChevronRight className="w-5 h-5 ms-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Review + consents */}
      {step === 'review' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('jobRole')}
                className="p-1"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div>
                <CardTitle className="text-xl sm:text-2xl text-[#16252d]">
                  {t('reviewTitle')}
                </CardTitle>
                <CardDescription>{t('reviewSubtitle')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {savedOccupations.length > 0 && (
              <div className="rounded-lg border border-[#4644b8]/20 bg-[#4644b8]/5 p-4 space-y-2">
                <p className="text-sm font-semibold text-[#16252d]">{t('savedOccupations')}</p>
                {savedOccupations.map((occ) => (
                  <p key={occ.id} className="text-sm text-gray-700">
                    {occ.preferredLabel}
                    {occ.skills.length > 0 && (
                      <span className="text-gray-500">
                        {' '}
                        — {occ.skills.length} {t('skills')}
                      </span>
                    )}
                  </p>
                ))}
              </div>
            )}
            <ReviewStep
              formValues={reviewFormValues}
              sameAsPhone={sameAsPhone}
              control={controlAs}
              errors={errorsAs}
              onEditStep={handleEditFromReview}
            />
            <Button
              onClick={handleRegisterSubmit}
              disabled={isRegistering}
              className="w-full h-12 text-base bg-[#4644b8] hover:bg-[#3533a0] text-white"
            >
              {isRegistering ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin me-2" />
                  {t('creatingAccount')}
                </>
              ) : (
                t('createAccount')
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-gray-400 text-center px-4">{t('attribution')}</p>
    </div>
  )
}

function QualificationSummary({
  template,
  answers,
}: {
  template: QualificationTemplateResponse
  answers: AnswerMap
}) {
  const t = useTranslations('demoCandReg.qualification')
  const categories = [
    'experience',
    'tasks',
    'equipment',
    'licence',
    'environment',
    'verification',
    'availability',
  ] as const

  return (
    <div className="space-y-3 border-t border-gray-100 pt-3">
      <p className="text-xs font-semibold text-[#4644b8]">{t('summaryTitle')}</p>
      {categories.map((cat) => {
        const qs = template.questions.filter(
          (q) => q.category === cat && answers[q.id] !== undefined,
        )
        if (!qs.length) return null
        return (
          <div key={cat}>
            <p className="text-xs font-medium text-gray-500 mb-1">{t(`categories.${cat}`)}</p>
            <ul className="space-y-1">
              {qs.map((q) => {
                const a = answers[q.id]
                let display = '—'
                if (typeof a === 'boolean') display = a ? t('yes') : t('no')
                else if (Array.isArray(a)) display = a.join(', ')
                else if (a !== undefined && a !== null) display = String(a)
                return (
                  <li key={q.id} className="text-sm text-[#16252d]">
                    <span className="text-gray-500">{q.label}: </span>
                    {display}
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

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
