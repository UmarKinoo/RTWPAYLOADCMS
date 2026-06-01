import type { BillingClass } from '@/lib/billing'

/** Map sidebar job-type labels to DB enum values on candidates.job_preferences_work_type */
export function normalizeJobTypeFilter(value: string): string | null {
  const map: Record<string, string> = {
    'Full-time': 'full-time',
    'Part-time': 'part-time',
    Contract: 'contract',
    Freelance: 'freelance',
    'full-time': 'full-time',
    'part-time': 'part-time',
    contract: 'contract',
    freelance: 'freelance',
  }
  const normalized = map[value.trim()]
  return normalized ?? null
}

/** Map skill-level filter labels to billing class letters on candidates */
export function skillLevelToBillingClass(value: string): BillingClass | null {
  const map: Record<string, BillingClass> = {
    Beginner: 'A',
    Intermediate: 'B',
    Advanced: 'C',
    Expert: 'D',
    A: 'A',
    B: 'B',
    C: 'C',
    D: 'D',
    S: 'S',
  }
  return map[value.trim()] ?? null
}
