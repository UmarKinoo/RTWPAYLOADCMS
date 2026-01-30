'use client'

import React, { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Settings, Lock, Mail, Phone, MessageSquare, Trash2, CheckCircle2, XCircle, Loader2, Eye, EyeOff } from 'lucide-react'
import type { Candidate } from '@/payload-types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { DashboardSidebar } from './DashboardSidebar'
import { DashboardHeader } from './DashboardHeader'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import { BottomNav } from '@/components/homepage/BottomNav'
import { Menu } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  changePassword,
  changeEmail,
  updatePhone,
  updateWhatsApp,
  resendEmailVerification,
  deleteAccount,
} from '@/lib/candidate/account-settings'
import { PhoneVerification } from '@/components/auth/phone-verification'
import { clearAuthCookies } from '@/lib/auth'

interface SettingsViewProps {
  candidate: Candidate
  unreadNotificationsCount?: number
}

export function SettingsView({ candidate: initialCandidate, unreadNotificationsCount = 0 }: SettingsViewProps) {
  const t = useTranslations('candidateDashboard.settings')
  const [candidate, setCandidate] = useState(initialCandidate)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()

  const handleUpdate = (updatedData: Partial<Candidate>) => {
    setCandidate((prev) => ({ ...prev, ...updatedData } as Candidate))
  }

  return (
    <div className="relative min-h-screen bg-[#f5f5f5]">
      {/* Mobile Menu Button */}
      <div className="fixed left-4 top-4 z-40 lg:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileMenuOpen(true)}
          className="h-11 w-11 bg-white shadow-md border-2 border-gray-200"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <DashboardSidebar unreadNotificationsCount={unreadNotificationsCount} />
      </div>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-full max-w-[280px] sm:w-[320px] p-0 flex flex-col overflow-hidden z-[110]">
          <VisuallyHidden>
            <SheetTitle>{t('navMenuTitle')}</SheetTitle>
          </VisuallyHidden>
          <DashboardSidebar mobile onClose={() => setMobileMenuOpen(false)} unreadNotificationsCount={unreadNotificationsCount} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="px-4 pb-20 md:pb-8 pt-16 sm:px-6 lg:ml-[220px] lg:pr-6 lg:pt-6">
        {/* Header Section */}
        <DashboardHeader 
          candidate={candidate} 
          unreadNotificationsCount={unreadNotificationsCount}
          notifications={[]}
        />

        {/* Settings Content — title lives in DashboardHeader above */}
        <div className="mt-6">
          {/* Settings Sections */}
          <div className="space-y-6">
            {/* Change Password Section */}
            <ChangePasswordSection />

            {/* Email Section */}
            <EmailSection candidate={candidate} onUpdate={handleUpdate} />

            {/* Phone Section */}
            <PhoneSection candidate={candidate} onUpdate={handleUpdate} />

            {/* WhatsApp Section */}
            <WhatsAppSection candidate={candidate} onUpdate={handleUpdate} />

            {/* Delete Account Section */}
            <DeleteAccountSection />
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav candidate={candidate} />
    </div>
  )
}

// Change Password Component
function ChangePasswordSection() {
  const t = useTranslations('candidateDashboard.settings.changePassword')
  const tCommon = useTranslations('candidateDashboard.common')
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
      toast.error(tCommon('anErrorOccurred'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="size-5 text-[#282828]" />
          <CardTitle>{t('title')}</CardTitle>
        </div>
        <CardDescription>{t('description')}</CardDescription>
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
            <Label htmlFor="confirm-password" className="text-sm font-medium">{t('confirmPassword')}</Label>
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
              t('submitButton')
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

// Email Section Component
function EmailSection({ candidate, onUpdate }: { candidate: Candidate; onUpdate: (data: Partial<Candidate>) => void }) {
  const t = useTranslations('candidateDashboard.settings.email')
  const tCommon = useTranslations('candidateDashboard.common')
  const [newEmail, setNewEmail] = useState('')
  const [isChanging, setIsChanging] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const emailVerified = (candidate as any).emailVerified || false

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail || newEmail === candidate.email) {
      toast.error(t('pleaseEnterDifferentEmail'))
      return
    }

    setIsChanging(true)
    try {
      const result = await changeEmail(newEmail)
      
      if (result.success) {
        toast.success(t('verificationEmailSentNew'))
        setNewEmail('')
        onUpdate({ email: newEmail, emailVerified: false } as any)
      } else {
        toast.error(result.error || t('failedToChangeEmail'))
      }
    } catch (error) {
      toast.error(tCommon('anErrorOccurred'))
    } finally {
      setIsChanging(false)
    }
  }

  const handleResendVerification = async () => {
    setIsResending(true)
    try {
      const result = await resendEmailVerification()
      
      if (result.success) {
        toast.success(t('verificationEmailSent'))
      } else {
        toast.error(result.error || t('failedToSendVerification'))
      }
    } catch (error) {
      toast.error(tCommon('anErrorOccurred'))
    } finally {
      setIsResending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="size-5 text-[#282828]" />
          <CardTitle>{t('title')}</CardTitle>
        </div>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t('currentEmail')}</Label>
          <div className="flex items-center gap-2">
            <Input value={candidate.email} disabled className="bg-[#f5f5f5]" />
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
              placeholder={t('placeholder')}
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
function PhoneSection({ candidate, onUpdate }: { candidate: Candidate; onUpdate: (data: Partial<Candidate>) => void }) {
  const t = useTranslations('candidateDashboard.settings.phone')
  const tCommon = useTranslations('candidateDashboard.common')
  const tEmail = useTranslations('candidateDashboard.settings.email')
  const [phone, setPhone] = useState(candidate.phone || '')
  const [isUpdating, setIsUpdating] = useState(false)
  const [showVerification, setShowVerification] = useState(false)
  const phoneVerified = (candidate as any).phoneVerified || false

  const handleUpdatePhone = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone || phone === candidate.phone) {
      toast.error(t('pleaseEnterDifferentPhone'))
      return
    }

    setIsUpdating(true)
    try {
      const result = await updatePhone(phone)
      
      if (result.success && result.candidate) {
        toast.success(t('phoneUpdatedVerify'))
        onUpdate(result.candidate)
        setShowVerification(true)
      } else {
        toast.error(result.error || t('failedToUpdatePhone'))
      }
    } catch (error) {
      toast.error(tCommon('anErrorOccurred'))
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
          <CardTitle>{t('title')}</CardTitle>
        </div>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t('currentPhone')}</Label>
          <div className="flex items-center gap-2">
            <Input value={candidate.phone} disabled className="bg-[#f5f5f5]" dir="ltr" />
            {phoneVerified ? (
              <div className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle2 className="size-4" />
                <span>{tEmail('verified')}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-sm text-amber-600">
                <XCircle className="size-4" />
                <span>{tEmail('notVerified')}</span>
              </div>
            )}
          </div>
        </div>

        {showVerification ? (
            <div className="rounded-lg border border-[#ededed] bg-[#fafafa] p-4">
            <PhoneVerification
              phone={phone}
              userId={String(candidate.id)}
              userCollection="candidates"
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
                  placeholder={t('placeholder')}
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
            {!phoneVerified && candidate.phone && (
              <div className="rounded-lg border border-[#ededed] bg-[#fafafa] p-4">
                <PhoneVerification
                  phone={candidate.phone}
                  userId={String(candidate.id)}
                  userCollection="candidates"
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

// WhatsApp Section Component
function WhatsAppSection({ candidate, onUpdate }: { candidate: Candidate; onUpdate: (data: Partial<Candidate>) => void }) {
  const t = useTranslations('candidateDashboard.settings.whatsApp')
  const tCommon = useTranslations('candidateDashboard.common')
  const tPhone = useTranslations('candidateDashboard.settings.phone')
  const [whatsapp, setWhatsapp] = useState((candidate as any).whatsapp || '')
  const [isUpdating, setIsUpdating] = useState(false)

  const handleUpdateWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)
    try {
      const result = await updateWhatsApp(whatsapp)
      
      if (result.success && result.candidate) {
        toast.success(t('whatsAppUpdatedSuccess'))
        onUpdate(result.candidate)
      } else {
        toast.error(result.error || t('failedToUpdateWhatsApp'))
      }
    } catch (error) {
      toast.error(tCommon('anErrorOccurred'))
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageSquare className="size-5 text-[#282828]" />
          <CardTitle>{t('title')}</CardTitle>
        </div>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpdateWhatsApp} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="whatsapp" className="text-sm font-medium">{t('whatsAppNumber')}</Label>
            <Input
              id="whatsapp"
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder={t('placeholder')}
            />
          </div>
          <Button type="submit" disabled={isUpdating} className="bg-[#4644b8] hover:bg-[#3a3aa0]">
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {tPhone('updating')}
              </>
            ) : (
              t('updateWhatsApp')
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

// Delete Account Section Component
function DeleteAccountSection() {
  const t = useTranslations('candidateDashboard.settings.deleteAccount')
  const tCommon = useTranslations('candidateDashboard.common')
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
      toast.error(tCommon('anErrorOccurred'))
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
          <CardTitle className="text-red-600">{t('title')}</CardTitle>
        </div>
        <CardDescription className="text-red-700">
          {t('description')}
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
              {t('deleteButton')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('areYouSure')}</AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>{t('deleteWarning')}</p>
                <p className="font-semibold text-red-600">{t('deleteWarningDetail')}</p>
                <div className="space-y-2 pt-2">
                  <Label htmlFor="delete-password" className="text-sm font-medium">{t('enterPasswordToConfirm')}</Label>
                  <Input
                    id="delete-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('passwordPlaceholder')}
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
                  t('deleteButton')
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}

