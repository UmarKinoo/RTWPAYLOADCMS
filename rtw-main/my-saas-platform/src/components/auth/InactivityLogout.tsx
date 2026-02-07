'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useLocale } from 'next-intl'

const DEFAULT_TIMEOUT_MINUTES = 120 // 2 hours
const THROTTLE_MS = 60_000 // only reset timer at most once per minute

function getTimeoutMinutes(): number {
  if (typeof process.env.NEXT_PUBLIC_INACTIVITY_TIMEOUT_MINUTES === 'string') {
    const n = parseInt(process.env.NEXT_PUBLIC_INACTIVITY_TIMEOUT_MINUTES, 10)
    if (Number.isFinite(n) && n > 0) return n
  }
  return DEFAULT_TIMEOUT_MINUTES
}

type InactivityLogoutProps = {
  children: React.ReactNode
}

/**
 * Tracks user activity and redirects to login (clearing session) after a period of inactivity.
 * Only used inside authenticated (admin) layout. Resets timer on pointer, keyboard, scroll, touch.
 */
export function InactivityLogout({ children }: InactivityLogoutProps) {
  const locale = useLocale()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastActivityRef = useRef<number>(Date.now())

  const scheduleLogout = useCallback(() => {
    const minutes = getTimeoutMinutes()
    const ms = minutes * 60 * 1000

    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      const loginUrl = `/${locale}/login?error=inactive`
      const clearUrl = `/api/auth/clear-session?next=${encodeURIComponent(loginUrl)}`
      window.location.href = clearUrl
    }, ms)
  }, [locale])

  const onActivity = useCallback(() => {
    const now = Date.now()
    if (now - lastActivityRef.current < THROTTLE_MS) return
    lastActivityRef.current = now
    scheduleLogout()
  }, [scheduleLogout])

  useEffect(() => {
    scheduleLogout()

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click']
    events.forEach((ev) => window.addEventListener(ev, onActivity))

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, onActivity))
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [onActivity, scheduleLogout])

  return <>{children}</>
}
