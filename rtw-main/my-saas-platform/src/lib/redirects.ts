'use server'

import { redirect } from 'next/navigation'

/**
 * Centralized redirect helpers. Use these instead of hardcoded redirect('/login') or redirect('/dashboard')
 * so locale is always correct and "from" param is consistent. Ban raw /login and /dashboard in code review.
 * Exported as async so Next.js treats them as valid Server Actions when this file is under 'use server'.
 */

export async function redirectToLogin(
  locale: string,
  options?: { from?: string; error?: string },
): Promise<never> {
  const params = new URLSearchParams()
  if (options?.from) params.set('from', options.from)
  if (options?.error) params.set('error', options.error)
  const qs = params.toString()
  redirect(`/${locale}/login${qs ? `?${qs}` : ''}`)
}

export async function redirectToDashboard(locale: string): Promise<never> {
  redirect(`/${locale}/dashboard`)
}

export async function redirectToNoAccess(locale: string): Promise<never> {
  redirect(`/${locale}/no-access`)
}

export async function redirectToAdmin(): Promise<never> {
  redirect('/admin')
}

export async function redirectToModeratorPanel(locale: string): Promise<never> {
  redirect(`/${locale}/moderator/interviews/pending`)
}

export async function redirectToEmployerDashboard(locale: string): Promise<never> {
  redirect(`/${locale}/employer/dashboard`)
}
