'use client'

import { Fragment, useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowUpRight,
  Bot,
  Brain,
  Check,
  ClipboardList,
  FileSearch,
  MessageSquare,
  RefreshCw,
  ScrollText,
  Sparkles,
  UserCheck,
  X,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import type {
  ReadyBotDashboardData,
  ReadyBotHumanReviewRow,
  ReadyBotLiveLogRow,
} from '@/lib/readybot/dashboard-types'
import { readybotDark, StatusBadge, formatDashboardDate } from './readybot-ui'
import { ReadyBotLiveFeed } from './ReadyBotLiveFeed'
import { ReadyBotChat } from './ReadyBotChat'
import { ReadyBotOpsPanel } from './ReadyBotOpsPanel'
import type { ReadyBotRuntimeSettings } from '@/lib/readybot/settings'
import type { ReadyBotTriggerStatus } from '@/lib/readybot/triggerStatus'
import { cn } from '@/lib/utils'

const TAB_IDS = [
  'overview',
  'chat',
  'live',
  'results',
  'tasks',
  'messages',
  'memory',
  'review',
  'audit',
  'pipeline',
] as const

type TabId = (typeof TAB_IDS)[number]

function isTabId(v: string | null): v is TabId {
  return TAB_IDS.includes(v as TabId)
}

type ReadyBotDashboardProps = {
  locale: string
  data: ReadyBotDashboardData
  initialLiveLogs: ReadyBotLiveLogRow[]
  liveServerTime: string
  settings: ReadyBotRuntimeSettings
  triggerStatus: ReadyBotTriggerStatus
}

export function ReadyBotDashboard({
  locale,
  data,
  initialLiveLogs,
  liveServerTime,
  settings,
  triggerStatus,
}: Readonly<ReadyBotDashboardProps>) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const activeTab: TabId = isTabId(tabParam) ? tabParam : 'overview'

  const setTab = useCallback(
    (tab: TabId) => {
      const url = tab === 'overview' ? `/${locale}/readybot` : `/${locale}/readybot?tab=${tab}`
      router.push(url, { scroll: false })
    },
    [locale, router],
  )

  const [reviews, setReviews] = useState(data.humanReviews)
  const [processingReviewId, setProcessingReviewId] = useState<string | null>(null)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<ReadyBotHumanReviewRow | null>(null)
  const [rejectNotes, setRejectNotes] = useState('')

  const pendingReviews = useMemo(
    () => reviews.filter((r) => r.status === 'pending'),
    [reviews],
  )

  const handleApprove = async (reviewId: string) => {
    setProcessingReviewId(reviewId)
    try {
      const res = await fetch('/api/readybot/approve-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewTaskId: reviewId }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.error || 'Approval failed')
        return
      }
      toast.success('Update approved and applied')
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, status: 'approved' } : r)),
      )
      router.refresh()
    } catch {
      toast.error('Request failed')
    } finally {
      setProcessingReviewId(null)
    }
  }

  const handleReject = async () => {
    if (!rejectTarget) return
    setProcessingReviewId(rejectTarget.id)
    try {
      const res = await fetch('/api/readybot/reject-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewTaskId: rejectTarget.id,
          adminNotes: rejectNotes || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.error || 'Reject failed')
        return
      }
      toast.success('Review rejected')
      setReviews((prev) =>
        prev.map((r) => (r.id === rejectTarget.id ? { ...r, status: 'rejected' } : r)),
      )
      setRejectOpen(false)
      setRejectTarget(null)
      setRejectNotes('')
      router.refresh()
    } catch {
      toast.error('Request failed')
    } finally {
      setProcessingReviewId(null)
    }
  }

  const candidateHref = (id: string) => `/${locale}/readybot/candidates/${id}`

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Operations</h1>
          <p className={cn('mt-1 text-sm', readybotDark.muted)}>
            Live view of screening, messages, memory, human review, and audit trail.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
          onClick={() => router.refresh()}
        >
          <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => isTabId(v) && setTab(v)} className="gap-6">
        <TabsList className={cn('flex flex-wrap h-auto', readybotDark.tabsList)}>
          <TabsTrigger value="overview" className={readybotDark.tabsTrigger}>
            Overview
          </TabsTrigger>
          <TabsTrigger value="chat" className={readybotDark.tabsTrigger}>
            <Sparkles className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            Chat
          </TabsTrigger>
          <TabsTrigger value="live" className={readybotDark.tabsTrigger}>
            Live
          </TabsTrigger>
          <TabsTrigger value="results" className={readybotDark.tabsTrigger}>
            Results ({data.screeningResults.length})
          </TabsTrigger>
          <TabsTrigger value="tasks" className={readybotDark.tabsTrigger}>
            Tasks ({data.tasks.length})
          </TabsTrigger>
          <TabsTrigger value="messages" className={readybotDark.tabsTrigger}>
            Messages ({data.messages.length})
          </TabsTrigger>
          <TabsTrigger value="memory" className={readybotDark.tabsTrigger}>
            Memory ({data.memories.length})
          </TabsTrigger>
          <TabsTrigger value="review" className={readybotDark.tabsTrigger}>
            Review ({pendingReviews.length})
          </TabsTrigger>
          <TabsTrigger value="audit" className={readybotDark.tabsTrigger}>
            Audit ({data.auditLogs.length})
          </TabsTrigger>
          <TabsTrigger value="pipeline" className={readybotDark.tabsTrigger}>
            Pipeline ({data.pipelineCandidates.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Pending human review"
              value={data.stats.pendingHumanReview}
              icon={UserCheck}
              highlight={data.stats.pendingHumanReview > 0}
            />
            <StatCard
              title="Active screening tasks"
              value={data.stats.activeTasks}
              icon={ClipboardList}
            />
            <StatCard
              title="Contacted today"
              value={data.stats.contactedToday}
              icon={Bot}
            />
            <StatCard
              title="Messages today"
              value={`${data.stats.inboundToday} in / ${data.stats.outboundToday} out`}
              icon={MessageSquare}
              isText
            />
          </div>

          <Card className={readybotDark.card}>
            <CardHeader>
              <CardTitle className="text-zinc-100">Screening status breakdown</CardTitle>
              <CardDescription className={readybotDark.muted}>
                Candidates by <code className="text-zinc-300">readyBot.screeningStatus</code>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(data.stats.byStatus).map(([status, count]) => (
                  <div
                    key={status}
                    className="rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-2"
                  >
                    <StatusBadge status={status} />
                    <p className="mt-1 text-lg font-semibold tabular-nums text-zinc-50">{count}</p>
                  </div>
                ))}
              </div>
              <p className={cn('mt-4 text-xs', readybotDark.muted)}>
                {data.stats.screeningResultsTotal} screening results ·{' '}
                {data.stats.candidatesInPipeline} candidates in pipeline
              </p>
            </CardContent>
          </Card>

          <ReadyBotOpsPanel
            initialSettings={settings}
            triggerStatus={triggerStatus}
            onRunScanStarted={() => setTab('live')}
          />
        </TabsContent>

        <TabsContent value="chat" className="mt-0 min-h-0">
          <ReadyBotChat locale={locale} />
        </TabsContent>

        <TabsContent value="live">
          <ReadyBotLiveFeed
            locale={locale}
            initialLogs={initialLiveLogs}
            initialServerTime={liveServerTime}
          />
        </TabsContent>

        <TabsContent value="results">
          <DataSection
            title="Screening results"
            description="Role fit scores, gaps, and recommended questions from the CV → job comparison."
            icon={FileSearch}
          >
            <ResultsTable rows={data.screeningResults} candidateHref={candidateHref} />
          </DataSection>
        </TabsContent>

        <TabsContent value="tasks">
          <DataSection
            title="Screening tasks"
            description="Outbound outreach state, attempts, and extracted reply payloads."
            icon={ClipboardList}
          >
            <TasksTable rows={data.tasks} candidateHref={candidateHref} />
          </DataSection>
        </TabsContent>

        <TabsContent value="messages">
          <DataSection
            title="Candidate messages"
            description="Inbound and outbound WhatsApp (or email) bodies with timestamps."
            icon={MessageSquare}
          >
            <MessagesTable rows={data.messages} candidateHref={candidateHref} />
          </DataSection>
        </TabsContent>

        <TabsContent value="memory">
          <DataSection
            title="Candidate memory"
            description="One row per candidate — compact LLM working memory (not the full profile)."
            icon={Brain}
          >
            <MemoryTable rows={data.memories} candidateHref={candidateHref} />
          </DataSection>
        </TabsContent>

        <TabsContent value="review">
          <DataSection
            title="Human review queue"
            description="Approve safe field updates or reject suggested changes from the agent."
            icon={UserCheck}
          >
            <ReviewsTable
              rows={reviews}
              candidateHref={candidateHref}
              processingId={processingReviewId}
              onApprove={handleApprove}
              onReject={(row) => {
                setRejectTarget(row)
                setRejectOpen(true)
              }}
            />
          </DataSection>
        </TabsContent>

        <TabsContent value="audit">
          <DataSection
            title="Agent audit logs"
            description="Immutable trail of tool actions, auto-updates, and memory writes."
            icon={ScrollText}
          >
            <AuditTable rows={data.auditLogs} candidateHref={candidateHref} />
          </DataSection>
        </TabsContent>

        <TabsContent value="pipeline">
          <DataSection
            title="Pipeline candidates"
            description="Candidates with ReadyBot enabled or an active screening status."
            icon={Bot}
          >
            <PipelineList rows={data.pipelineCandidates} candidateHref={candidateHref} />
          </DataSection>
        </TabsContent>
      </Tabs>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
          <DialogHeader>
            <DialogTitle>Reject human review</DialogTitle>
            <DialogDescription className={readybotDark.muted}>
              Optional notes for the audit trail.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            placeholder="Reason for rejection…"
            className="border-zinc-700 bg-zinc-950 text-zinc-100"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!!processingReviewId}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon: Icon,
  highlight,
  isText,
}: {
  title: string
  value: number | string
  icon: React.ComponentType<{ className?: string }>
  highlight?: boolean
  isText?: boolean
}) {
  return (
    <Card
      className={cn(
        readybotDark.card,
        highlight && 'border-orange-500/40 ring-1 ring-orange-500/20',
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription className={readybotDark.muted}>{title}</CardDescription>
          <Icon className="h-4 w-4 text-emerald-500/80" aria-hidden />
        </div>
      </CardHeader>
      <CardContent>
        <p className={isText ? 'text-sm font-medium text-zinc-50' : readybotDark.statValue}>
          {value}
        </p>
      </CardContent>
    </Card>
  )
}

function DataSection({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <Card className={readybotDark.card}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-emerald-400" aria-hidden />
          <CardTitle className="text-zinc-100">{title}</CardTitle>
        </div>
        <CardDescription className={readybotDark.muted}>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function ResultsTable({
  rows,
  candidateHref,
}: {
  rows: ReadyBotDashboardData['screeningResults']
  candidateHref: (id: string) => string
}) {
  if (!rows.length) return <EmptyState label="No screening results yet." />
  return (
    <ScrollArea className="h-[min(520px,60vh)]">
      <Table>
        <TableHeader>
          <TableRow className={readybotDark.tableRow}>
            <TableHead className={readybotDark.tableHead}>Candidate</TableHead>
            <TableHead className={readybotDark.tableHead}>Role</TableHead>
            <TableHead className={readybotDark.tableHead}>Fit</TableHead>
            <TableHead className={readybotDark.tableHead}>Gaps / Q</TableHead>
            <TableHead className={readybotDark.tableHead}>Status</TableHead>
            <TableHead className={readybotDark.tableHead}>Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id} className={readybotDark.tableRow}>
              <TableCell>
                <CandidateLink href={candidateHref(r.candidate.id)} label={r.candidate.label} />
              </TableCell>
              <TableCell className="max-w-[200px] truncate text-zinc-300">
                {r.targetRoleTitle}
              </TableCell>
              <TableCell className="tabular-nums text-zinc-200">
                {r.fitScore != null ? `${r.fitScore}%` : '—'}
              </TableCell>
              <TableCell className="text-zinc-400">
                {r.gapCount} / {r.questionCount}
              </TableCell>
              <TableCell>
                <StatusBadge status={r.status} />
              </TableCell>
              <TableCell className="text-zinc-500 text-xs">
                {formatDashboardDate(r.updatedAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  )
}

function TasksTable({
  rows,
  candidateHref,
}: {
  rows: ReadyBotDashboardData['tasks']
  candidateHref: (id: string) => string
}) {
  const [expanded, setExpanded] = useState<string | null>(null)
  if (!rows.length) return <EmptyState label="No screening tasks yet." />
  return (
    <ScrollArea className="h-[min(520px,60vh)]">
      <Table>
        <TableHeader>
          <TableRow className={readybotDark.tableRow}>
            <TableHead className={readybotDark.tableHead}>Candidate</TableHead>
            <TableHead className={readybotDark.tableHead}>Status</TableHead>
            <TableHead className={readybotDark.tableHead}>Channel</TableHead>
            <TableHead className={readybotDark.tableHead}>Missing</TableHead>
            <TableHead className={readybotDark.tableHead}>Message</TableHead>
            <TableHead className={readybotDark.tableHead}>Last sent</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((t) => (
            <Fragment key={t.id}>
              <TableRow
                className={cn(readybotDark.tableRow, 'cursor-pointer')}
                onClick={() => setExpanded(expanded === t.id ? null : t.id)}
              >
                <TableCell>
                  <CandidateLink href={candidateHref(t.candidate.id)} label={t.candidate.label} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={t.status} />
                </TableCell>
                <TableCell className="capitalize text-zinc-400">{t.channel}</TableCell>
                <TableCell className="text-zinc-400">{t.missingFieldCount}</TableCell>
                <TableCell className="max-w-[240px] truncate text-zinc-500 text-xs">
                  {t.messagePreview ?? '—'}
                </TableCell>
                <TableCell className="text-zinc-500 text-xs">
                  {formatDashboardDate(t.lastSentAt)}
                </TableCell>
              </TableRow>
              {expanded === t.id && t.messageBody && (
                <TableRow key={`${t.id}-expanded`} className="bg-zinc-900/60">
                  <TableCell colSpan={6} className="px-4 py-3">
                    <p className="text-[11px] text-zinc-400 mb-1 font-semibold uppercase tracking-wide">Full message</p>
                    <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">{t.messageBody}</p>
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  )
}

function MessagesTable({
  rows,
  candidateHref,
}: {
  rows: ReadyBotDashboardData['messages']
  candidateHref: (id: string) => string
}) {
  if (!rows.length) return <EmptyState label="No messages logged yet." />
  return (
    <ScrollArea className="h-[min(520px,60vh)]">
      <Table>
        <TableHeader>
          <TableRow className={readybotDark.tableRow}>
            <TableHead className={readybotDark.tableHead}>Candidate</TableHead>
            <TableHead className={readybotDark.tableHead}>Dir</TableHead>
            <TableHead className={readybotDark.tableHead}>Body</TableHead>
            <TableHead className={readybotDark.tableHead}>Status</TableHead>
            <TableHead className={readybotDark.tableHead}>Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((m) => (
            <TableRow key={m.id} className={readybotDark.tableRow}>
              <TableCell>
                <CandidateLink href={candidateHref(m.candidate.id)} label={m.candidate.label} />
              </TableCell>
              <TableCell>
                <span
                  className={cn(
                    'text-xs font-medium uppercase',
                    m.direction === 'inbound' ? 'text-violet-400' : 'text-sky-400',
                  )}
                >
                  {m.direction}
                </span>
              </TableCell>
              <TableCell className="max-w-md text-zinc-300 text-xs">{m.bodyPreview}</TableCell>
              <TableCell>
                <StatusBadge status={m.status} />
              </TableCell>
              <TableCell className="text-zinc-500 text-xs whitespace-nowrap">
                {formatDashboardDate(m.receivedAt ?? m.sentAt ?? m.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  )
}

function MemoryTable({
  rows,
  candidateHref,
}: {
  rows: ReadyBotDashboardData['memories']
  candidateHref: (id: string) => string
}) {
  if (!rows.length) return <EmptyState label="No memory documents yet." />
  return (
    <ScrollArea className="h-[min(520px,60vh)]">
      <Table>
        <TableHeader>
          <TableRow className={readybotDark.tableRow}>
            <TableHead className={readybotDark.tableHead}>Candidate</TableHead>
            <TableHead className={readybotDark.tableHead}>CV summary</TableHead>
            <TableHead className={readybotDark.tableHead}>Conversation</TableHead>
            <TableHead className={readybotDark.tableHead}>Fields</TableHead>
            <TableHead className={readybotDark.tableHead}>Last decision</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((mem) => (
            <TableRow key={mem.id} className={readybotDark.tableRow}>
              <TableCell>
                <CandidateLink
                  href={candidateHref(mem.candidate.id)}
                  label={mem.candidate.label}
                />
              </TableCell>
              <TableCell className="max-w-[200px] text-xs text-zinc-500">
                {mem.cvSummaryPreview ?? '—'}
              </TableCell>
              <TableCell className="max-w-[200px] text-xs text-zinc-500">
                {mem.conversationSummaryPreview ?? '—'}
              </TableCell>
              <TableCell className="text-xs text-zinc-400">
                miss {mem.missingFieldCount} · ok {mem.confirmedCount} · risk {mem.riskCount}
              </TableCell>
              <TableCell className="max-w-[180px] truncate text-xs text-zinc-500">
                {mem.lastAgentDecision ?? '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  )
}

function ReviewsTable({
  rows,
  candidateHref,
  processingId,
  onApprove,
  onReject,
}: {
  rows: ReadyBotHumanReviewRow[]
  candidateHref: (id: string) => string
  processingId: string | null
  onApprove: (id: string) => void
  onReject: (row: ReadyBotHumanReviewRow) => void
}) {
  if (!rows.length) return <EmptyState label="No human review tasks." />
  return (
    <div className="space-y-4">
      {rows.map((r) => (
        <div
          key={r.id}
          className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 space-y-3"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CandidateLink href={candidateHref(r.candidate.id)} label={r.candidate.label} />
              <p className="mt-1 text-sm text-zinc-300">{r.reason}</p>
              <p className="mt-1 text-xs text-zinc-500">{formatDashboardDate(r.createdAt)}</p>
            </div>
            <StatusBadge status={r.status} />
          </div>
          <pre className="max-h-40 overflow-auto rounded-md bg-zinc-900 p-3 text-xs text-zinc-400">
            {JSON.stringify(r.suggestedUpdate, null, 2)}
          </pre>
          {r.status === 'pending' ? (
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
                disabled={processingId === r.id}
                onClick={() => onApprove(r.id)}
              >
                <Check className="mr-1 h-4 w-4" aria-hidden />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-zinc-700 text-zinc-200"
                disabled={processingId === r.id}
                onClick={() => onReject(r)}
              >
                <X className="mr-1 h-4 w-4" aria-hidden />
                Reject
              </Button>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function AuditTable({
  rows,
  candidateHref,
}: {
  rows: ReadyBotDashboardData['auditLogs']
  candidateHref: (id: string) => string
}) {
  if (!rows.length) return <EmptyState label="No audit logs yet." />
  return (
    <ScrollArea className="h-[min(520px,60vh)]">
      <Table>
        <TableHeader>
          <TableRow className={readybotDark.tableRow}>
            <TableHead className={readybotDark.tableHead}>Action</TableHead>
            <TableHead className={readybotDark.tableHead}>Candidate</TableHead>
            <TableHead className={readybotDark.tableHead}>Tool</TableHead>
            <TableHead className={readybotDark.tableHead}>Confidence</TableHead>
            <TableHead className={readybotDark.tableHead}>When</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((a) => (
            <TableRow key={a.id} className={readybotDark.tableRow}>
              <TableCell className="text-xs">
                {a.phase ? (
                  <span className="text-emerald-400/90 uppercase">{a.phase}</span>
                ) : (
                  <span className="font-mono text-emerald-400/90">{a.action}</span>
                )}
                {a.step ? (
                  <p className="text-zinc-500 mt-0.5 font-sans">{a.step}</p>
                ) : null}
              </TableCell>
              <TableCell>
                {a.candidateId ? (
                  <CandidateLink
                    href={candidateHref(a.candidateId)}
                    label={a.candidateLabel ?? `#${a.candidateId}`}
                  />
                ) : (
                  '—'
                )}
              </TableCell>
              <TableCell className="text-zinc-500 text-xs">{a.toolUsed ?? '—'}</TableCell>
              <TableCell className="text-zinc-400 tabular-nums text-xs">
                {a.confidence != null ? a.confidence.toFixed(2) : '—'}
              </TableCell>
              <TableCell className="text-zinc-500 text-xs">
                {formatDashboardDate(a.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  )
}

function PipelineList({
  rows,
  candidateHref,
}: {
  rows: ReadyBotDashboardData['pipelineCandidates']
  candidateHref: (id: string) => string
}) {
  if (!rows.length) return <EmptyState label="No candidates in ReadyBot pipeline." />
  return (
    <ul className="divide-y divide-zinc-800">
      {rows.map((c) => (
        <li key={c.id} className="flex items-center justify-between py-3">
          <div>
            <CandidateLink href={candidateHref(c.id)} label={c.label} />
            <p className="mt-0.5 text-xs text-zinc-500">
              {c.screeningStatus ? (
                <StatusBadge status={c.screeningStatus} />
              ) : (
                'no status'
              )}
            </p>
          </div>
          <ArrowUpRight className="h-4 w-4 text-zinc-600" aria-hidden />
        </li>
      ))}
    </ul>
  )
}

function CandidateLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className={cn('font-medium', readybotDark.link)}>
      {label}
    </Link>
  )
}

function EmptyState({ label }: { label: string }) {
  return <p className={cn('py-8 text-center text-sm', readybotDark.muted)}>{label}</p>
}
