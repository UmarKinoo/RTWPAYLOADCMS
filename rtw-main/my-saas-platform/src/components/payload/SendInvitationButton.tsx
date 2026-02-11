'use client'

import React, { useState } from 'react'
import { useDocumentInfo, useForm } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'

type Props = {
  id?: string | number
}

/**
 * Payload custom component: "Send invitation" for Users collection.
 * - Create view: enter email (and role), click "Send invitation" → user is created and email sent (no save needed).
 * - Edit view: click "Send invitation" to resend the invitation email.
 */
export function SendInvitationButton(props: Props) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const docInfo = useDocumentInfo()
  const form = useForm()
  const router = useRouter()

  const idFromProps = props.id != null ? Number(props.id) : null
  const idFromDoc = docInfo?.id != null ? Number(docInfo.id) : null
  const userId = idFromProps ?? idFromDoc
  const isCreateView = userId == null || Number.isNaN(userId)

  const handleSendExisting = async () => {
    if (userId == null || Number.isNaN(userId)) return
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/users/send-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
        credentials: 'include',
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Invitation email sent.' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send invitation.' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to send invitation.' })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAndInvite = async () => {
    const data = typeof form?.getData === 'function' ? form.getData() : {}
    const email = (data?.email as string)?.trim?.() ?? ''
    const role = ['admin', 'blog-editor', 'moderator', 'user'].includes(data?.role as string)
      ? (data.role as string)
      : undefined

    if (!email) {
      setMessage({ type: 'error', text: 'Enter an email address first.' })
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address.' })
      return
    }

    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/users/create-and-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
        credentials: 'include',
      })
      const result = await res.json()
      if (result.success && result.userId) {
        setMessage({ type: 'success', text: 'User created and invitation sent.' })
        const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
        const base = pathname.replace(/\/create\/?$/, '').replace(/\/new\/?$/, '') || '/admin'
        router.push(`${base}/${result.userId}`)
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to create and send invitation.' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to create and send invitation.' })
    } finally {
      setLoading(false)
    }
  }

  const handleSend = isCreateView ? handleCreateAndInvite : handleSendExisting

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <button
        type="button"
        onClick={handleSend}
        disabled={loading}
        style={{
          padding: '6px 12px',
          fontSize: 13,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? 'Sending…' : isCreateView ? 'Send invitation' : 'Send invitation'}
      </button>
      {message && (
        <span
          style={{
            fontSize: 12,
            color: message.type === 'success' ? 'var(--theme-success-500)' : 'var(--theme-error-500)',
          }}
        >
          {message.text}
        </span>
      )}
    </div>
  )
}
