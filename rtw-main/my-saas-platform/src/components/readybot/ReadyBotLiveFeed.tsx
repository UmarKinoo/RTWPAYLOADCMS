'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Circle, Pause, Play, Radio } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ReadyBotLiveLogRow } from '@/lib/readybot/dashboard-types'
import { readybotDark } from './readybot-ui'

const POLL_MS = 800

const PHASE_COLOR: Record<string, string> = {
  scan: 'text-amber-400',
  screening: 'text-emerald-400',
  inbound: 'text-violet-400',
  memory: 'text-sky-400',
  followup: 'text-orange-400',
  review: 'text-pink-400',
  system: 'text-zinc-500',
}

const STATUS_DOT: Record<string, string> = {
  started: 'bg-sky-400 animate-pulse',
  running: 'bg-sky-400 animate-pulse',
  success: 'bg-emerald-400',
  skipped: 'bg-zinc-600',
  error: 'bg-red-400',
}

function shortTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function shortStep(step: string) {
  return step
    .replace(/^[①②③④⑤⑥⑦⑧⑨⑩]\s*/, '')
    .replace(/ ✓$/, '')
    .replace(/ ✗$/, '')
    .trim()
}

type ReadyBotLiveFeedProps = {
  locale: string
  initialLogs: ReadyBotLiveLogRow[]
  initialServerTime: string
}

export function ReadyBotLiveFeed({ locale, initialLogs, initialServerTime }: Readonly<ReadyBotLiveFeedProps>) {
  const [logs, setLogs] = useState<ReadyBotLiveLogRow[]>(initialLogs)
  const [live, setLive] = useState(true)
  const [lastFetch, setLastFetch] = useState<string | null>(initialServerTime)
  const [error, setError] = useState<string | null>(null)
  const seenIds = useRef(new Set(initialLogs.map((l) => l.id)))
  const bottomRef = useRef<HTMLDivElement>(null)

  const mergeLogs = useCallback((incoming: ReadyBotLiveLogRow[]) => {
    if (!incoming.length) return
    setLogs((prev) => {
      const next = [...prev]
      for (const row of incoming) {
        if (seenIds.current.has(row.id)) continue
        seenIds.current.add(row.id)
        next.push(row)
      }
      return next.slice(-200)
    })
  }, [])

  const fetchLogs = useCallback(async (incremental: boolean) => {
    try {
      const qs = incremental && lastFetch ? `?since=${encodeURIComponent(lastFetch)}` : ''
      const res = await fetch(`/api/readybot/live-logs${qs}`, { credentials: 'include' })
      if (!res.ok) {
        setError(res.status === 401 ? 'Session expired' : 'Failed to load logs')
        return
      }
      setError(null)
      const json = (await res.json()) as { logs: ReadyBotLiveLogRow[]; serverTime: string }
      setLastFetch(json.serverTime)
      if (incremental) mergeLogs(json.logs)
      else {
        seenIds.current = new Set(json.logs.map((l) => l.id))
        setLogs(json.logs)
      }
    } catch {
      setError('Network error')
    }
  }, [lastFetch, mergeLogs])

  useEffect(() => {
    if (!live) return
    const id = setInterval(() => void fetchLogs(true), POLL_MS)
    return () => clearInterval(id)
  }, [live, fetchLogs])

  useEffect(() => {
    if (live) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs.length, live])

  return (
    <Card className={readybotDark.card}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className={cn('h-4 w-4', live ? 'text-emerald-400 animate-pulse' : 'text-zinc-600')} />
            <CardTitle className="text-zinc-100 text-sm">Live</CardTitle>
            {error && <span className="text-xs text-red-400">{error}</span>}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" className="text-zinc-400 h-7 text-xs" onClick={() => void fetchLogs(false)}>
              Clear
            </Button>
            <Button size="sm" variant="ghost" className="text-zinc-400 h-7 text-xs" onClick={() => setLive((v) => !v)}>
              {live ? <><Pause className="mr-1 h-3 w-3" />Pause</> : <><Play className="mr-1 h-3 w-3" />Resume</>}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[min(560px,65vh)] overflow-y-auto rounded-b-lg bg-zinc-950 font-mono text-xs">
          {logs.length === 0 ? (
            <p className="py-12 text-center text-zinc-600">
              No activity. Run <span className="text-emerald-400">pnpm readybot:scan</span> to start.
            </p>
          ) : (
            <table className="w-full">
              <tbody>
                {logs.map((log) => {
                  const href = log.candidateId ? `/${locale}/readybot/candidates/${log.candidateId}` : null
                  const dot = STATUS_DOT[log.status] ?? 'bg-zinc-600'
                  const phaseColor = PHASE_COLOR[log.phase] ?? PHASE_COLOR.system
                  return (
                    <tr key={log.id} className="border-b border-zinc-900 hover:bg-zinc-900/40">
                      <td className="pl-3 pr-2 py-1.5 text-zinc-600 whitespace-nowrap">{shortTime(log.createdAt)}</td>
                      <td className="px-1 py-1.5">
                        <span className={cn('inline-block h-1.5 w-1.5 rounded-full', dot)} />
                      </td>
                      <td className={cn('px-2 py-1.5 uppercase font-bold whitespace-nowrap', phaseColor)}>
                        {log.phase.slice(0, 4)}
                      </td>
                      <td className="px-2 py-1.5 text-zinc-400 whitespace-nowrap">
                        {href ? (
                          <Link href={href} className="hover:text-zinc-200 transition-colors">
                            {log.candidateLabel ?? '—'}
                          </Link>
                        ) : (
                          <span>{log.candidateLabel ?? '—'}</span>
                        )}
                      </td>
                      <td className="px-2 py-1.5 text-zinc-200">{shortStep(log.step)}</td>
                      <td className="pr-3 py-1.5 text-zinc-600 text-[10px] whitespace-nowrap">
                        {log.status === 'error' && log.detail
                          ? <span className="text-red-400">{String((log.detail as Record<string,unknown>).error ?? 'error')}</span>
                          : log.toolUsed ?? ''}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
          <div ref={bottomRef} />
        </div>
        <p className="flex items-center gap-2 px-3 py-2 text-[10px] text-zinc-700">
          <Circle className={cn('h-1.5 w-1.5 fill-current', live ? 'text-emerald-600' : 'text-zinc-700')} />
          {live ? `polling every ${POLL_MS}ms` : 'paused'}
        </p>
      </CardContent>
    </Card>
  )
}
