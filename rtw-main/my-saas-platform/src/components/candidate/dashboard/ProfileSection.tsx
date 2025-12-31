'use client'

import { useState, useRef } from 'react'
import { ImagePlus, Download, Loader2 } from 'lucide-react'
import type { Candidate } from '@/payload-types'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { updateCandidate } from '@/lib/candidate'
import { toast } from 'sonner'
import { getMediaUrl } from '@/utilities/getMediaUrl'

interface ProfileSectionProps {
  candidate: Candidate
  onUpdate: (data: Partial<Candidate>) => void
}

export function ProfileSection({ candidate, onUpdate }: ProfileSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const initials = `${candidate.firstName?.[0] || ''}${candidate.lastName?.[0] || ''}`.toUpperCase()

  // Get profile picture URL
  const getProfilePictureUrl = () => {
    if (candidate.profilePicture && typeof candidate.profilePicture === 'object') {
      const media = candidate.profilePicture as any
      return getMediaUrl(media.url, media.updatedAt)
    }
    return ''
  }

  const profilePictureUrl = getProfilePictureUrl()

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type (images only)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type', {
        description: 'Please upload an image file (JPG, PNG, WEBP, or GIF).',
      })
      return
    }

    // Validate file size (max 5MB for images)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast.error('File too large', {
        description: 'Please upload an image smaller than 5MB.',
      })
      return
    }

    setIsUploading(true)

    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('alt', `${candidate.firstName} ${candidate.lastName} profile picture`)

      // Upload file to Payload media collection
      const uploadResponse = await fetch('/api/media', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.errors?.[0]?.message || 'Upload failed')
      }

      const uploadResult = await uploadResponse.json()
      const uploadedMedia = uploadResult.doc || uploadResult

      if (!uploadedMedia || !uploadedMedia.id) {
        throw new Error('Invalid response from server')
      }

      // Update candidate with the profile picture media ID
      const result = await updateCandidate(candidate.id, {
        profilePicture: uploadedMedia.id,
      } as any)

      if (result.success) {
        onUpdate(result.candidate || {})
        toast.success('Profile picture uploaded successfully', {
          description: 'Your profile picture has been updated.',
        })
      } else {
        toast.error('Failed to save profile picture', {
          description: result.error || 'Please try again.',
        })
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error('Upload failed', {
        description: error.message || 'Please try again.',
      })
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click()
  }

  const getPrimarySkillName = () => {
    if (typeof candidate.primarySkill === 'object' && candidate.primarySkill?.name) {
      return candidate.primarySkill.name
    }
    return 'Not set'
  }

  return (
    <Card className="rounded-xl bg-white p-4 shadow-sm sm:rounded-2xl sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
        {/* Profile Photo */}
        <button
          onClick={handleProfilePictureClick}
          disabled={isUploading}
          className="relative mx-auto size-24 shrink-0 overflow-hidden rounded-xl border-2 border-dashed border-[#ededed] transition-colors hover:border-[#4644b8] disabled:cursor-not-allowed disabled:opacity-50 sm:mx-0 sm:size-28"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Avatar className="size-full rounded-xl">
            <AvatarImage src={profilePictureUrl} alt={`${candidate.firstName} ${candidate.lastName}`} />
            <AvatarFallback className="bg-[#ededed] text-lg text-[#282828]">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity hover:opacity-100">
            {isUploading ? (
              <Loader2 className="size-8 animate-spin text-white" />
            ) : (
              <ImagePlus className="size-8 text-white" />
            )}
          </div>
        </button>

        {/* Profile Info */}
        <div className="flex flex-1 flex-col justify-center gap-3 text-center sm:gap-4 sm:text-left">
          <div>
            <h2 className="text-base font-semibold text-[#4644b8] sm:text-lg">
              {candidate.firstName} {candidate.lastName}
            </h2>
            <div className="mt-1 flex flex-col items-center gap-2 sm:flex-row sm:items-center">
              <p className="text-sm text-[#282828]">
                {candidate.jobTitle || 'No job title'} • {candidate.location || 'No location'}
              </p>
              <Badge className="bg-[#4644b8]/10 text-[#4644b8] hover:bg-[#4644b8]/20 border-[#4644b8]/20 text-xs">
                Working but looking for new opportunities
              </Badge>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-fit mx-auto border-[#4644b8] text-[#4644b8] hover:bg-[#4644b8] hover:text-white sm:mx-0"
          >
            <Download className="mr-2 size-4" />
            Download PDF Resume
          </Button>
        </div>
      </div>
    </Card>
  )
}
