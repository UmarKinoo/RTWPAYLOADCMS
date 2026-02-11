'use client'

import React, { useState } from 'react'

type Props = {
  id?: string | number
}

/**
 * Payload custom component: "Send invitation" button for Users collection edit view.
 * Sends an invitation email so the user can set their password via /accept-invitation.
 */
export function SendInvitationButton(props: Props) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const userId = props.id != null ? Number(props.id) : null
  if (userId == null || Number.isNaN(userId)) {
    return null
  }

  const handleSend = async () => {
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
        {loading ? 'Sending…' : 'Send invitation'}
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
