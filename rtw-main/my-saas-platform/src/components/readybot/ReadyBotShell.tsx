'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Activity,
  Bot,
  Brain,
  ClipboardList,
  FileSearch,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Radio,
  ScrollText,
  Sparkles,
  UserCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { clearAuthCookies } from '@/lib/auth'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { readybotDark } from './readybot-ui'

const NAV = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, hash: '' },
  { id: 'chat', label: 'Ops chat', icon: Sparkles, hash: 'chat' },
  { id: 'live', label: 'Live activity', icon: Radio, hash: 'live' },
  { id: 'results', label: 'Screening results', icon: FileSearch, hash: 'results' },
  { id: 'tasks', label: 'Screening tasks', icon: ClipboardList, hash: 'tasks' },
  { id: 'messages', label: 'Messages', icon: MessageSquare, hash: 'messages' },
  { id: 'memory', label: 'Memory', icon: Brain, hash: 'memory' },
  { id: 'review', label: 'Human review', icon: UserCheck, hash: 'review' },
  { id: 'audit', label: 'Audit logs', icon: ScrollText, hash: 'audit' },
  { id: 'pipeline', label: 'Pipeline', icon: Activity, hash: 'pipeline' },
] as const

type ReadyBotShellProps = {
  locale: string
  children: React.ReactNode
  pendingReviewCount?: number
}

export function ReadyBotShell({
  locale,
  children,
  pendingReviewCount = 0,
}: Readonly<ReadyBotShellProps>) {
  const pathname = usePathname() ?? ''
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const isDetail = pathname.includes('/readybot/candidates/')
  const base = `/${locale}/readybot`

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await clearAuthCookies()
      toast.success('Logged out')
      router.push(`/${locale}/login`)
      router.refresh()
    } catch {
      toast.error('Logout failed')
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div className={readybotDark.shell}>
      <aside className={readybotDark.sidebar}>
        <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-4">
          <Bot className="h-7 w-7 text-emerald-400" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-zinc-50">ReadyBot</p>
            <p className="text-xs text-zinc-500">Ops dashboard</p>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 p-2" aria-label="ReadyBot sections">
          {NAV.map((item) => {
            const href = item.hash ? `${base}?tab=${item.hash}` : base
            const active =
              !isDetail &&
              (item.hash === ''
                ? pathname.endsWith('/readybot') && !pathname.includes('?')
                : false)
            return (
              <Link
                key={item.id}
                href={href}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                  active
                    ? 'bg-zinc-800 text-emerald-400'
                    : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100',
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                <span className="flex-1">{item.label}</span>
                {item.id === 'review' && pendingReviewCount > 0 ? (
                  <span className="rounded-full bg-orange-500/20 px-1.5 text-xs text-orange-300">
                    {pendingReviewCount}
                  </span>
                ) : null}
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-zinc-800 p-2 space-y-1">
          <Link
            href="/admin"
            className="block rounded-md px-3 py-2 text-xs text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
          >
            Payload CMS →
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            <LogOut className="mr-2 h-4 w-4" aria-hidden />
            {loggingOut ? 'Signing out…' : 'Log out'}
          </Button>
        </div>
      </aside>

      <div className={readybotDark.main}>
        <header
          className={cn(
            readybotDark.header,
            'flex items-center justify-between px-4 py-3 lg:px-8',
          )}
        >
          <div className="flex items-center gap-2 lg:hidden">
            <Bot className="h-5 w-5 text-emerald-400" aria-hidden />
            <span className="font-semibold">ReadyBot</span>
          </div>
          <p className={cn('text-sm', readybotDark.muted, 'hidden lg:block')}>
            AI screening visibility — not Payload admin
          </p>
          <div className="flex gap-2 overflow-x-auto lg:hidden">
            {NAV.slice(0, 5).map((item) => (
              <Link
                key={item.id}
                href={item.hash ? `${base}?tab=${item.hash}` : base}
                className="whitespace-nowrap rounded-md border border-zinc-800 px-2 py-1 text-xs text-zinc-400"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </header>
        {children}
      </div>
    </div>
  )
}
