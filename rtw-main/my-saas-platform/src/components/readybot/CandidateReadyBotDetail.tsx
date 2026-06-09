'use client'

import Link from 'next/link'
import { ArrowLeft, Brain, MessageSquare, ScrollText } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ReadyBotCandidateDetailData } from '@/lib/readybot/dashboard-types'
import { readybotDark, StatusBadge, formatDashboardDate } from './readybot-ui'
import { cn } from '@/lib/utils'

type Props = {
  locale: string
  data: ReadyBotCandidateDetailData
}

export function CandidateReadyBotDetail({ locale, data }: Readonly<Props>) {
  const { candidate: c } = data
  const rb = c.readyBot

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 space-y-6">
      <Link
        href={`/${locale}/readybot`}
        className={cn('inline-flex items-center text-sm', readybotDark.link)}
      >
        <ArrowLeft className="mr-1 h-4 w-4" aria-hidden />
        Back to dashboard
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">{c.label}</h1>
        <p className={cn('mt-1 text-sm', readybotDark.muted)}>
          {c.email ?? '—'} · {c.phone ?? '—'} · {c.jobTitle ?? 'No job title'}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {rb.screeningStatus ? <StatusBadge status={rb.screeningStatus} /> : null}
          {rb.whatsappOptIn ? (
            <Badge variant="outline" className="border-zinc-700 text-sky-400">
              WhatsApp opt-in
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className={cn(readybotDark.card, 'lg:col-span-1')}>
          <CardHeader>
            <CardTitle className="text-zinc-100 text-base">Screening meta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <MetaRow label="Last screened" value={formatDashboardDate(rb.lastScreenedAt)} />
            <MetaRow label="Last contacted" value={formatDashboardDate(rb.lastContactedAt)} />
            <MetaRow label="Last reply" value={formatDashboardDate(rb.lastReplyAt)} />
            <MetaRow
              label="Confidence"
              value={
                rb.screeningConfidence != null
                  ? `${Math.round(rb.screeningConfidence * 100)}%`
                  : '—'
              }
            />
            <MetaRow label="WhatsApp" value={rb.whatsappNumber ?? '—'} />
            {rb.missingFields?.length ? (
              <div className="pt-2">
                <p className={readybotDark.muted}>Missing fields</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {rb.missingFields.map((f) => (
                    <Badge
                      key={f.field}
                      variant="secondary"
                      className="bg-zinc-800 text-zinc-300"
                    >
                      {f.field}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
            {rb.screeningSummary ? (
              <p className="pt-2 text-xs text-zinc-400 leading-relaxed">{rb.screeningSummary}</p>
            ) : null}
          </CardContent>
        </Card>

        <Card className={cn(readybotDark.card, 'lg:col-span-2')}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-emerald-400" aria-hidden />
              <CardTitle className="text-zinc-100 text-base">Persistent memory</CardTitle>
            </div>
            <CardDescription className={readybotDark.muted}>
              AI context document — updated on screening and after each reply compaction.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {data.memory ? (
              <>
                <MemoryBlock title="CV summary" text={data.memory.cvSummaryPreview} />
                <MemoryBlock
                  title="Conversation summary"
                  text={data.memory.conversationSummaryPreview}
                />
                <p className={readybotDark.muted}>
                  Confirmed {data.memory.confirmedCount} · Missing {data.memory.missingFieldCount}{' '}
                  · Risks {data.memory.riskCount}
                </p>
                {data.memory.lastAgentDecision ? (
                  <p className="text-xs text-zinc-500 italic">{data.memory.lastAgentDecision}</p>
                ) : null}
              </>
            ) : (
              <p className={readybotDark.muted}>No memory row yet — run screening scan first.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Section title="Message thread" icon={MessageSquare} count={data.messages.length}>
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {data.messages.length === 0 ? (
            <p className={readybotDark.muted}>No messages.</p>
          ) : (
            data.messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  'rounded-lg border px-3 py-2 text-sm',
                  m.direction === 'inbound'
                    ? 'border-violet-500/30 bg-violet-500/5 ml-4'
                    : 'border-sky-500/30 bg-sky-500/5 mr-4',
                )}
              >
                <div className="flex justify-between text-xs text-zinc-500 mb-1">
                  <span className="uppercase font-medium">{m.direction}</span>
                  <span>{formatDashboardDate(m.receivedAt ?? m.sentAt ?? m.createdAt)}</span>
                </div>
                <p className="text-zinc-200 whitespace-pre-wrap">{m.bodyPreview}</p>
              </div>
            ))
          )}
        </div>
      </Section>

      <Section title="Screening results" count={data.screeningResults.length}>
        {data.screeningResults.map((r) => (
          <div key={r.id} className="rounded-lg border border-zinc-800 p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-zinc-200">{r.targetRoleTitle}</span>
              <StatusBadge status={r.status} />
            </div>
            <p className="text-zinc-400">
              Fit {r.fitScore ?? '—'}% · {r.gapCount} gaps · {r.questionCount} questions
            </p>
            {r.fitSummary ? <p className="text-xs text-zinc-500">{r.fitSummary}</p> : null}
          </div>
        ))}
      </Section>

      <Section title="Screening tasks" count={data.tasks.length}>
        {data.tasks.map((t) => (
          <div key={t.id} className="flex justify-between border-b border-zinc-800 py-2 text-sm">
            <StatusBadge status={t.status} />
            <span className="text-zinc-500">{formatDashboardDate(t.updatedAt)}</span>
          </div>
        ))}
      </Section>

      <Section title="Audit trail" icon={ScrollText} count={data.auditLogs.length}>
        <ul className="space-y-2 text-xs font-mono">
          {data.auditLogs.map((a) => (
            <li key={a.id} className="flex gap-2 text-zinc-400">
              <span className="text-emerald-500/80 shrink-0">{a.action}</span>
              <span className="text-zinc-600">·</span>
              <span className="shrink-0">{formatDashboardDate(a.createdAt)}</span>
              {a.toolUsed ? <span className="text-zinc-600 truncate">· {a.toolUsed}</span> : null}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className={readybotDark.muted}>{label}</span>
      <span className="text-zinc-200 text-right">{value}</span>
    </div>
  )
}

function MemoryBlock({ title, text }: { title: string; text?: string | null }) {
  if (!text) return null
  return (
    <div>
      <p className="text-xs font-medium text-zinc-400 mb-1">{title}</p>
      <p className="text-zinc-300 leading-relaxed">{text}</p>
    </div>
  )
}

function Section({
  title,
  icon: Icon,
  count,
  children,
}: {
  title: string
  icon?: React.ComponentType<{ className?: string }>
  count: number
  children: React.ReactNode
}) {
  return (
    <Card className={readybotDark.card}>
      <CardHeader>
        <div className="flex items-center gap-2">
          {Icon ? <Icon className="h-5 w-5 text-emerald-400" aria-hidden /> : null}
          <CardTitle className="text-zinc-100 text-base">
            {title} ({count})
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
