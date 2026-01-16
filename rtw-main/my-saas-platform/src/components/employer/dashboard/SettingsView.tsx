'use client'

import React, { useState } from 'react'
import { Settings, ArrowLeft, Lock, Mail, Phone, Trash2, CheckCircle2, XCircle, Loader2, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import type { Employer } from '@/payload-types'
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
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  changePassword,
  changeEmail,
  updatePhone,
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
          <h1 className="text-2xl font-semibold text-[#282828] sm:text-3xl">Account Settings</h1>
          <p className="text-sm text-[#757575]">Manage your account security and preferences</p>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
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

// Change Password Component
function ChangePasswordSection() {
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
      toast.error('Passwords do not match')
      return
    }

    setIsSaving(true)
    try {
      const result = await changePassword(currentPassword, newPassword)
      
      if (result.success) {
        toast.success('Password changed successfully')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        toast.error(result.error || 'Failed to change password')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="size-5 text-[#282828]" />
          <CardTitle>Change Password</CardTitle>
        </div>
        <CardDescription>Update your password to keep your account secure</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="current-password" className="text-sm font-medium">Current Password</Label>
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
            <Label htmlFor="new-password" className="text-sm font-medium">New Password</Label>
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
              Must be at least 8 characters with uppercase, lowercase, number, and special character
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-sm font-medium">Confirm New Password</Label>
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
                Changing...
              </>
            ) : (
              'Change Password'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

// Email Section Component
function EmailSection({ employer, onUpdate }: { employer: Employer; onUpdate: (data: Partial<Employer>) => void }) {
  const [newEmail, setNewEmail] = useState('')
  const [isChanging, setIsChanging] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const emailVerified = (employer as any).emailVerified || false

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail || newEmail === employer.email) {
      toast.error('Please enter a different email address')
      return
    }

    setIsChanging(true)
    try {
      const result = await changeEmail(newEmail)
      
      if (result.success) {
        toast.success('Verification email sent. Please check your new email address.')
        setNewEmail('')
        onUpdate({ email: newEmail, emailVerified: false } as any)
      } else {
        toast.error(result.error || 'Failed to change email')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setIsChanging(false)
    }
  }

  const handleResendVerification = async () => {
    setIsResending(true)
    try {
      const result = await resendEmailVerification()
      
      if (result.success) {
        toast.success('Verification email sent. Please check your inbox.')
      } else {
        toast.error(result.error || 'Failed to send verification email')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="size-5 text-[#282828]" />
          <CardTitle>Email Address</CardTitle>
        </div>
        <CardDescription>Manage your email address and verification</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Current Email</Label>
          <div className="flex items-center gap-2">
            <Input value={employer.email} disabled className="bg-[#f5f5f5]" />
            {emailVerified ? (
              <div className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle2 className="size-4" />
                <span>Verified</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-sm text-amber-600">
                <XCircle className="size-4" />
                <span>Not Verified</span>
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
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 size-4" />
                  Resend Verification Email
                </>
              )}
            </Button>
          </div>
        )}

        <Separator />

        <form onSubmit={handleChangeEmail} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="new-email" className="text-sm font-medium">New Email Address</Label>
            <Input
              id="new-email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter new email address"
              required
            />
          </div>
          <Button type="submit" disabled={isChanging} className="bg-[#4644b8] hover:bg-[#3a3aa0]">
            {isChanging ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Changing...
              </>
            ) : (
              'Change Email'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

// Phone Section Component
function PhoneSection({ employer, onUpdate }: { employer: Employer; onUpdate: (data: Partial<Employer>) => void }) {
  const [phone, setPhone] = useState(employer.phone || '')
  const [isUpdating, setIsUpdating] = useState(false)
  const [showVerification, setShowVerification] = useState(false)
  const phoneVerified = (employer as any).phoneVerified || false

  const handleUpdatePhone = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone || phone === employer.phone) {
      toast.error('Please enter a different phone number')
      return
    }

    setIsUpdating(true)
    try {
      const result = await updatePhone(phone)
      
      if (result.success) {
        toast.success('Phone number updated. Please verify your new number.')
        onUpdate({ phone, phoneVerified: false } as any)
        setShowVerification(true)
      } else {
        toast.error(result.error || 'Failed to update phone')
      }
    } catch (error) {
      toast.error('An error occurred')
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
          <CardTitle>Phone Number</CardTitle>
        </div>
        <CardDescription>Update your phone number and verify it</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Current Phone</Label>
          <div className="flex items-center gap-2">
            <Input value={employer.phone || ''} disabled className="bg-[#f5f5f5]" />
            {phoneVerified ? (
              <div className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle2 className="size-4" />
                <span>Verified</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-sm text-amber-600">
                <XCircle className="size-4" />
                <span>Not Verified</span>
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
                <Label htmlFor="new-phone" className="text-sm font-medium">New Phone Number</Label>
                <Input
                  id="new-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter new phone number"
                  required
                />
              </div>
              <Button type="submit" disabled={isUpdating} className="bg-[#4644b8] hover:bg-[#3a3aa0]">
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Phone'
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
  const [password, setPassword] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!password) {
      toast.error('Please enter your password to confirm')
      return
    }

    setIsDeleting(true)
    try {
      const result = await deleteAccount(password)
      
      if (result.success) {
        toast.success('Account deleted successfully')
        await clearAuthCookies()
        router.push('/')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to delete account')
        setOpen(false)
      }
    } catch (error) {
      toast.error('An error occurred')
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
          <CardTitle className="text-red-600">Delete Account</CardTitle>
        </div>
        <CardDescription className="text-red-700">
          Permanently delete your account and all associated data. This action cannot be undone.
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
              Delete Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>This action cannot be undone. This will permanently delete your account and remove all your data from our servers.</p>
                <p className="font-semibold text-red-600">All your company information, interviews, and activity will be lost.</p>
                <div className="space-y-2 pt-2">
                  <Label htmlFor="delete-password" className="text-sm font-medium">Enter your password to confirm</Label>
                  <Input
                    id="delete-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPassword('')}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting || !password}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Account'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}

