'use client'

import { Upload, FileText, X, Download } from 'lucide-react'
import { useState, useRef } from 'react'
import type { Candidate, Media } from '@/payload-types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { updateCandidate } from '@/lib/candidate'
import { toast } from 'sonner'

interface ResumeUploadSectionProps {
  candidate: Candidate
  onUpdate: (data: Partial<Candidate>) => void
}

export function ResumeUploadSection({ candidate, onUpdate }: ResumeUploadSectionProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Get resume from candidate (could be a Media object or ID)
  const resume = candidate.resume
  const resumeMedia = typeof resume === 'object' ? resume : null
  const resumeId = typeof resume === 'object' && resume ? resume.id : typeof resume === 'number' ? resume : null

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type', {
        description: 'Please upload a PDF, DOC, or DOCX file.',
      })
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast.error('File too large', {
        description: 'Please upload a file smaller than 10MB.',
      })
      return
    }

    setIsUploading(true)

    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', file)

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

      // Update candidate with the resume media ID
      const result = await updateCandidate(candidate.id, {
        resume: uploadedMedia.id,
      } as any)

      if (result.success) {
        onUpdate(result.candidate || {})
        toast.success('Resume uploaded successfully', {
          description: 'Your resume has been uploaded and saved.',
        })
      } else {
        toast.error('Failed to save resume', {
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
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveResume = async () => {
    setIsSaving(true)
    try {
      const result = await updateCandidate(candidate.id, {
        resume: null,
      } as any)

      if (result.success) {
        onUpdate(result.candidate || {})
        toast.success('Resume removed successfully')
      } else {
        toast.error('Failed to remove resume', {
          description: result.error || 'Please try again.',
        })
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownload = () => {
    if (resumeMedia?.url) {
      window.open(resumeMedia.url, '_blank')
    }
  }

  return (
    <Card className="rounded-xl bg-white p-4 shadow-sm sm:rounded-2xl sm:p-6">
      {/* Header */}
      <div className="mb-4 text-center sm:mb-6">
        <h3 className="text-base font-semibold text-[#4644b8] sm:text-lg">Resume/CV</h3>
        <p className="mt-1 text-xs text-[#757575]">
          {resumeMedia ? 'Your resume is uploaded' : 'Upload your resume or CV document'}
        </p>
      </div>

      {/* Upload Area */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      <div className="mb-4 flex min-h-[140px] flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-[#4644b8] p-4 sm:min-h-[160px] sm:p-6">
        {resumeMedia ? (
          <>
            <FileText className="size-10 text-[#4644b8] sm:size-12" />
            <div className="text-center">
              <p className="text-sm font-medium text-[#282828]">
                {resumeMedia.filename || 'Resume'}
              </p>
              {resumeMedia.filesize && (
                <p className="text-xs text-[#757575]">
                  {formatFileSize(resumeMedia.filesize)}
                </p>
              )}
            </div>
            <div className="mt-2 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="border-[#4644b8] text-[#4644b8] hover:bg-[#4644b8] hover:text-white"
              >
                <Download className="mr-2 size-4" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveResume}
                disabled={isSaving}
                className="border-[#dc0000] text-[#dc0000] hover:bg-[#dc0000] hover:text-white"
              >
                <X className="mr-2 size-4" />
                Remove
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex size-10 items-center justify-center rounded-xl border border-[#4644b8] sm:size-12">
              <Upload className="size-5 text-[#4644b8] sm:size-6" />
            </div>
            <p className="text-sm font-medium text-[#282828]">No file uploaded</p>
            <p className="text-center text-xs text-[#757575]">
              Supported formats: PDF, DOC, DOCX (Max 10MB)
            </p>
          </>
        )}
      </div>

      {/* Upload Button */}
      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="w-full border-[#4644b8] text-[#4644b8] hover:bg-[#4644b8] hover:text-white"
      >
        {isUploading ? (
          <>
            <Upload className="mr-2 size-4 animate-pulse" />
            Uploading...
          </>
        ) : resumeMedia ? (
          <>
            <Upload className="mr-2 size-4" />
            Replace Resume
          </>
        ) : (
          <>
            <Upload className="mr-2 size-4" />
            Upload Resume
          </>
        )}
      </Button>
    </Card>
  )
}
