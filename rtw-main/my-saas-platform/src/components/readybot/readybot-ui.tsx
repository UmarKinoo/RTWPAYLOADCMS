import { cn } from '@/lib/utils'

export const readybotDark = {
  page: 'min-h-screen bg-zinc-950 text-zinc-100',
  shell: 'flex min-h-screen',
  sidebar:
    'hidden w-56 shrink-0 flex-col border-r border-zinc-800 bg-zinc-900/80 lg:flex',
  main: 'flex-1 overflow-x-hidden',
  header: 'border-b border-zinc-800 bg-zinc-900/60 backdrop-blur',
  card: 'border-zinc-800 bg-zinc-900/50 shadow-none',
  muted: 'text-zinc-400',
  tableHead: 'text-zinc-400 border-zinc-800',
  tableRow: 'border-zinc-800 hover:bg-zinc-900/80',
  tabsList: 'bg-zinc-900 border border-zinc-800',
  tabsTrigger:
    'text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-400',
  link: 'text-emerald-400 hover:text-emerald-300 hover:underline',
  accent: 'text-emerald-400',
  statValue: 'text-2xl font-semibold tabular-nums text-zinc-50',
} as const

export function statusBadgeClass(status: string): string {
  const s = status.toLowerCase()
  if (s.includes('pending') || s === 'new' || s === 'incomplete' || s === 'draft')
    return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
  if (s.includes('await') || s.includes('contact') || s === 'ready_to_contact')
    return 'bg-sky-500/15 text-sky-300 border-sky-500/30'
  if (s.includes('reply') || s.includes('received') || s === 'info_received')
    return 'bg-violet-500/15 text-violet-300 border-violet-500/30'
  if (s.includes('human') || s.includes('review') || s.includes('needs'))
    return 'bg-orange-500/15 text-orange-300 border-orange-500/30'
  if (s.includes('complete') || s.includes('verified') || s.includes('approved'))
    return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
  if (s.includes('reject') || s.includes('fail') || s === 'unresponsive')
    return 'bg-red-500/15 text-red-300 border-red-500/30'
  return 'bg-zinc-700/50 text-zinc-300 border-zinc-600'
}

export function formatDashboardDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-md border px-2 py-0.5 text-xs font-medium capitalize',
        statusBadgeClass(status),
      )}
    >
      {status.replaceAll('_', ' ')}
    </span>
  )
}
