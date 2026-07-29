'use client'

import { useCallback, useEffect, useRef } from 'react'

const DRAFT_PREFIX = 'rtw-form-draft:'
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000 // drafts expire after 7 days
const SAVE_DEBOUNCE_MS = 500

interface StoredDraft<T> {
  v: number
  savedAt: number
  data: T
}

interface UseFormDraftOptions {
  /** Bump when the form shape changes so stale drafts are discarded */
  version?: number
  ttlMs?: number
}

/**
 * Persist in-progress form data to localStorage so users who close the tab can
 * pick up where they left off.
 *
 * - Writes are debounced; a pending write is flushed on tab close (beforeunload).
 * - Drafts carry a version and expiry; mismatches are silently discarded.
 * - Callers must NEVER pass secrets (passwords) or non-serializable values (Files).
 */
export function useFormDraft<T>(key: string, options?: UseFormDraftOptions) {
  const version = options?.version ?? 1
  const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS
  const storageKey = DRAFT_PREFIX + key

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pending = useRef<T | null>(null)

  const writeNow = useCallback(
    (data: T) => {
      try {
        const payload: StoredDraft<T> = { v: version, savedAt: Date.now(), data }
        window.localStorage.setItem(storageKey, JSON.stringify(payload))
      } catch {
        // Storage full or blocked (private mode) — drafts are best-effort
      }
    },
    [storageKey, version],
  )

  const loadDraft = useCallback((): T | null => {
    if (typeof window === 'undefined') return null
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (!raw) return null
      const parsed = JSON.parse(raw) as StoredDraft<T>
      if (parsed.v !== version || !parsed.savedAt || Date.now() - parsed.savedAt > ttlMs) {
        window.localStorage.removeItem(storageKey)
        return null
      }
      return parsed.data
    } catch {
      return null
    }
  }, [storageKey, version, ttlMs])

  const saveDraft = useCallback(
    (data: T) => {
      if (typeof window === 'undefined') return
      pending.current = data
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        if (pending.current !== null) {
          writeNow(pending.current)
          pending.current = null
        }
      }, SAVE_DEBOUNCE_MS)
    },
    [writeNow],
  )

  const clearDraft = useCallback(() => {
    if (typeof window === 'undefined') return
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    pending.current = null
    try {
      window.localStorage.removeItem(storageKey)
    } catch {
      // ignore
    }
  }, [storageKey])

  // Flush a debounce-pending draft when the tab is closed, so the very last
  // keystrokes survive the window being shut mid-debounce
  useEffect(() => {
    const flush = () => {
      if (pending.current !== null) {
        writeNow(pending.current)
        pending.current = null
      }
    }
    window.addEventListener('beforeunload', flush)
    return () => {
      window.removeEventListener('beforeunload', flush)
      if (timer.current) clearTimeout(timer.current)
    }
  }, [writeNow])

  return { loadDraft, saveDraft, clearDraft }
}
