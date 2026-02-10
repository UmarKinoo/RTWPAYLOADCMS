'use client'

import React, { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Settings, ArrowLeft, Lock, Mail, Phone, Trash2, CheckCircle2, XCircle, Loader2, Eye, EyeOff, Building2 } from 'lucide-react'
import Link from 'next/link'
import type { Employer } from '@/payload-types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  changePassword,
  changeEmail,
  updatePhone,
  updateEmployerProfile,
  resendEmailVerification,
  deleteAccount,
} from '@/lib/employer/account-settings'
import { PhoneVerification } from '@/components/auth/phone-verification'
import { clearAuthCookies } from '@/lib/auth'

interface SettingsViewProps {
  employer: Employer
}

export function SettingsView({ employer: initialEmployer }: SettingsViewProps) {
  const [employer, setEmployer] = useState(initialEmployer)
  const router = useRouter()
  const t = useTranslations('employerDashboard.settings')

  const handleUpdate = (updatedData: Partial<Employer>) => {
    setEmployer((prev) => ({ ...prev, ...updatedData } as Employer))
  }

  return (
    <div className="mt-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link href="/employer/dashboard">
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-[#282828] sm:text-3xl">{t('title')}</h1>
          <p className="text-sm text-[#757575]">{t('description')}</p>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Profile / Company details Section */}
        <ProfileSection employer={employer} onUpdate={handleUpdate} />

        {/* Change Password Section */}
        <ChangePasswordSection />

        {/* Email Section */}
        <EmailSection employer={employer} onUpdate={handleUpdate} />

        {/* Phone Section */}
        <PhoneSection employer={employer} onUpdate={handleUpdate} />

        {/* Delete Account Section */}
        <DeleteAccountSection />
      </div>
    </div>
  )
}

// Profile / Company details Section
const COMPANY_SIZE_OPTIONS = [
  { value: '1-10', labelKey: 'companySize1_10' },
  { value: '11-50', labelKey: 'companySize11_50' },
  { value: '51-200', labelKey: 'companySize51_200' },
  { value: '201-500', labelKey: 'companySize201_500' },
  { value: '500+', labelKey: 'companySize500' },
] as const

function ProfileSection({ employer, onUpdate }: { employer: Employer; onUpdate: (data: Partial<Employer>) => void }) {
  const t = useTranslations('employerDashboard.settings')
  const [responsiblePerson, setResponsiblePerson] = useState(employer.responsiblePerson ?? '')
  const [companyName, setCompanyName] = useState(employer.companyName ?? '')
  const [website, setWebsite] = useState(employer.website ?? '')
  const [address, setAddress] = useState(employer.address ?? '')
  const [industry, setIndustry] = useState(employer.industry ?? '')
  const [companySize, setCompanySize] = useState<Employer['companySize']>(employer.companySize ?? null)
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!responsiblePerson.trim()) {
      toast.error(t('responsiblePersonRequired'))
      return
    }
    if (!companyName.trim()) {
      toast.error(t('companyNameRequired'))
      return
    }
    setIsSaving(true)
    try {
      const result = await updateEmployerProfile({
        responsiblePerson: responsiblePerson.trim(),
        companyName: companyName.trim(),
        website: website.trim() || null,
        address: address.trim() || null,
        industry: industry.trim() || null,
        companySize: companySize ?? null,
      })
      if (result.success) {
        toast.success(t('profileSaved'))
        onUpdate({
          responsiblePerson: responsiblePerson.trim(),
          companyName: companyName.trim(),
          website: website.trim() || null,
          address: address.trim() || null,
          industry: industry.trim() || null,
          companySize: companySize ?? null,
        })
      } else {
        toast.error(result.error || t('failedToSaveProfile'))
      }
    } catch {
      toast.error(t('anErrorOccurred'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="size-5 text-[#282828]" />
          <CardTitle>{t('profileDetails')}</CardTitle>
        </div>
        <CardDescription>{t('profileDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="responsible-person" className="text-sm font-medium">{t('responsiblePerson')}</Label>
              <Input
                id="responsible-person"
                value={responsiblePerson}
                onChange={(e) => setResponsiblePerson(e.target.value)}
                placeholder={t('responsiblePersonPlaceholder')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-name" className="text-sm font-medium">{t('companyName')}</Label>
              <Input
                id="company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder={t('companyNamePlaceholder')}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="website" className="text-sm font-medium">{t('website')}</Label>
            <Input
              id="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder={t('websitePlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-medium">{t('companyAddress')}</Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t('companyAddressPlaceholder')}
              rows={3}
              className="resize-none"
            />
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="industry" className="text-sm font-medium">{t('industry')}</Label>
              <Input
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder={t('industryPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-size" className="text-sm font-medium">{t('companySize')}</Label>
              <Select
                value={companySize ?? ''}
                onValueChange={(v) => setCompanySize((v || null) as Employer['companySize'])}
              >
                <SelectTrigger id="company-size">
                  <SelectValue placeholder={t('companySizePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {COMPANY_SIZE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {t(opt.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" disabled={isSaving} className="bg-[#4644b8] hover:bg-[#3a3aa0]">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {t('saving')}
              </>
            ) : (
              t('saveProfile')
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

// Change Password Component
function ChangePasswordSection() {
  const t = useTranslations('employerDashboard.settings')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      toast.error(t('passwordsDoNotMatch'))
      return
    }

    setIsSaving(true)
    try {
      const result = await changePassword(currentPassword, newPassword)
      
      if (result.success) {
        toast.success(t('passwordChangedSuccess'))
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        toast.error(result.error || t('failedToChangePassword'))
      }
    } catch (error) {
      toast.error(t('anErrorOccurred'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="size-5 text-[#282828]" />
          <CardTitle>{t('changePassword')}</CardTitle>
        </div>
        <CardDescription>{t('changePasswordDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="current-password" className="text-sm font-medium">{t('currentPassword')}</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showPassword.current ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
              >
                {showPassword.current ? (
                  <EyeOff className="size-4 text-[#757575]" />
                ) : (
                  <Eye className="size-4 text-[#757575]" />
                )}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password" className="text-sm font-medium">{t('newPassword')}</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword.new ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pr-10"
                required
                minLength={8}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
              >
                {showPassword.new ? (
                  <EyeOff className="size-4 text-[#757575]" />
                ) : (
                  <Eye className="size-4 text-[#757575]" />
                )}
              </Button>
            </div>
            <p className="text-xs text-[#757575]">
              {t('passwordHint')}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-sm font-medium">{t('confirmNewPassword')}</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showPassword.confirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
              >
                {showPassword.confirm ? (
                  <EyeOff className="size-4 text-[#757575]" />
                ) : (
                  <Eye className="size-4 text-[#757575]" />
                )}
              </Button>
            </div>
          </div>
          <Button type="submit" disabled={isSaving} className="bg-[#4644b8] hover:bg-[#3a3aa0]">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {t('changing')}
              </>
            ) : (
              t('changePasswordButton')
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

// Email Section Component
function EmailSection({ employer, onUpdate }: { employer: Employer; onUpdate: (data: Partial<Employer>) => void }) {
  const t = useTranslations('employerDashboard.settings')
  const [newEmail, setNewEmail] = useState('')
  const [isChanging, setIsChanging] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const emailVerified = (employer as any).emailVerified || false

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail || newEmail === employer.email) {
      toast.error(t('pleaseEnterDifferentEmail'))
      return
    }

    setIsChanging(true)
    try {
      const result = await changeEmail(newEmail)
      
      if (result.success) {
        toast.success(t('verificationEmailSent'))
        setNewEmail('')
        onUpdate({ email: newEmail, emailVerified: false } as any)
      } else {
        toast.error(result.error || t('failedToChangeEmail'))
      }
    } catch (error) {
      toast.error(t('anErrorOccurred'))
    } finally {
      setIsChanging(false)
    }
  }

  const handleResendVerification = async () => {
    setIsResending(true)
    try {
      const result = await resendEmailVerification()
      
      if (result.success) {
        toast.success(t('verificationEmailSentInbox'))
      } else {
        toast.error(result.error || t('failedToSendVerification'))
      }
    } catch (error) {
      toast.error(t('anErrorOccurred'))
    } finally {
      setIsResending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="size-5 text-[#282828]" />
          <CardTitle>{t('emailAddress')}</CardTitle>
        </div>
        <CardDescription>{t('emailDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t('currentEmail')}</Label>
          <div className="flex items-center gap-2">
            <Input value={employer.email} disabled className="bg-[#f5f5f5]" />
            {emailVerified ? (
              <div className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle2 className="size-4" />
                <span>{t('verified')}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-sm text-amber-600">
                <XCircle className="size-4" />
                <span>{t('notVerified')}</span>
              </div>
            )}
          </div>
        </div>

        {!emailVerified && (
          <div>
            <Button
              variant="outline"
              onClick={handleResendVerification}
              disabled={isResending}
              className="w-full"
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {t('sending')}
                </>
              ) : (
                <>
                  <Mail className="mr-2 size-4" />
                  {t('resendVerificationEmail')}
                </>
              )}
            </Button>
          </div>
        )}

        <Separator />

        <form onSubmit={handleChangeEmail} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="new-email" className="text-sm font-medium">{t('newEmailAddress')}</Label>
            <Input
              id="new-email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder={t('enterNewEmail')}
              required
            />
          </div>
          <Button type="submit" disabled={isChanging} className="bg-[#4644b8] hover:bg-[#3a3aa0]">
            {isChanging ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {t('changing')}
              </>
            ) : (
              t('changeEmail')
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

// Phone Section Component
function PhoneSection({ employer, onUpdate }: { employer: Employer; onUpdate: (data: Partial<Employer>) => void }) {
  const t = useTranslations('employerDashboard.settings')
  const [phone, setPhone] = useState(employer.phone || '')
  const [isUpdating, setIsUpdating] = useState(false)
  const [showVerification, setShowVerification] = useState(false)
  const phoneVerified = (employer as any).phoneVerified || false

  const handleUpdatePhone = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone || phone === employer.phone) {
      toast.error(t('pleaseEnterDifferentPhone'))
      return
    }

    setIsUpdating(true)
    try {
      const result = await updatePhone(phone)
      
      if (result.success) {
        toast.success(t('phoneUpdated'))
        onUpdate({ phone, phoneVerified: false } as any)
        setShowVerification(true)
      } else {
        toast.error(result.error || t('failedToUpdatePhone'))
      }
    } catch (error) {
      toast.error(t('anErrorOccurred'))
    } finally {
      setIsUpdating(false)
    }
  }

  const handleVerified = () => {
    setShowVerification(false)
    onUpdate({ phoneVerified: true } as any)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Phone className="size-5 text-[#282828]" />
          <CardTitle>{t('phoneNumber')}</CardTitle>
        </div>
        <CardDescription>{t('phoneDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t('currentPhone')}</Label>
          <div className="flex items-center gap-2">
            <Input value={employer.phone || ''} disabled className="bg-[#f5f5f5]" dir="ltr" />
            {phoneVerified ? (
              <div className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle2 className="size-4" />
                <span>{t('verified')}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-sm text-amber-600">
                <XCircle className="size-4" />
                <span>{t('notVerified')}</span>
              </div>
            )}
          </div>
        </div>

        {showVerification ? (
          <div className="rounded-lg border border-[#ededed] bg-[#fafafa] p-4">
            <PhoneVerification
              phone={phone}
              userId={String(employer.id)}
              userCollection="employers"
              onVerified={handleVerified}
            />
          </div>
        ) : (
          <>
            <form onSubmit={handleUpdatePhone} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="new-phone" className="text-sm font-medium">{t('newPhoneNumber')}</Label>
                <Input
                  id="new-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t('enterNewPhone')}
                  required
                />
              </div>
              <Button type="submit" disabled={isUpdating} className="bg-[#4644b8] hover:bg-[#3a3aa0]">
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    {t('updating')}
                  </>
                ) : (
                  t('updatePhone')
                )}
              </Button>
            </form>
            {!phoneVerified && employer.phone && (
              <div className="rounded-lg border border-[#ededed] bg-[#fafafa] p-4">
                <PhoneVerification
                  phone={employer.phone}
                  userId={String(employer.id)}
                  userCollection="employers"
                  onVerified={handleVerified}
                />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

// Delete Account Section Component
function DeleteAccountSection() {
  const t = useTranslations('employerDashboard.settings')
  const [password, setPassword] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!password) {
      toast.error(t('pleaseEnterPassword'))
      return
    }

    setIsDeleting(true)
    try {
      const result = await deleteAccount(password)
      
      if (result.success) {
        toast.success(t('accountDeletedSuccess'))
        await clearAuthCookies()
        router.push('/')
        router.refresh()
      } else {
        toast.error(result.error || t('failedToDeleteAccount'))
        setOpen(false)
      }
    } catch (error) {
      toast.error(t('anErrorOccurred'))
      setOpen(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="border-red-200 bg-red-50/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Trash2 className="size-5 text-red-600" />
          <CardTitle className="text-red-600">{t('deleteAccount')}</CardTitle>
        </div>
        <CardDescription className="text-red-700">
          {t('deleteAccountDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog open={open} onOpenChange={(open) => {
          setOpen(open)
          if (!open) setPassword('')
        }}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
              <Trash2 className="mr-2 size-4" />
              {t('deleteAccount')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('deleteAccountConfirm')}</AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>{t('deleteAccountWarning')}</p>
                <p className="font-semibold text-red-600">{t('deleteAccountDataWarning')}</p>
                <div className="space-y-2 pt-2">
                  <Label htmlFor="delete-password" className="text-sm font-medium">{t('enterPasswordToConfirm')}</Label>
                  <Input
                    id="delete-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('enterYourPassword')}
                    required
                  />
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPassword('')}>{t('cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting || !password}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    {t('deleting')}
                  </>
                ) : (
                  t('deleteAccount')
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}

