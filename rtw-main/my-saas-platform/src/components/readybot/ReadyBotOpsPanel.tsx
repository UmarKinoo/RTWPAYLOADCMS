'use client'

import { useState } from 'react'
import { Bot, Clock, Network, Play, Zap } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { toast } from 'sonner'
import type { ReadyBotRuntimeSettings } from '@/lib/readybot/settings'
import type { ReadyBotTriggerStatus } from '@/lib/readybot/triggerStatus'
import { describeCron } from '@/lib/readybot/triggerStatus'
import { readybotDark, formatDashboardDate } from './readybot-ui'
import { cn } from '@/lib/utils'

type Props = {
  initialSettings: ReadyBotRuntimeSettings
  triggerStatus: ReadyBotTriggerStatus
  onRunScanStarted?: () => void
}

export function ReadyBotOpsPanel({ initialSettings, triggerStatus, onRunScanStarted }: Props) {
  const [settings, setSettings] = useState(initialSettings)
  const [saving, setSaving] = useState(false)
  const [runScanBusy, setRunScanBusy] = useState(false)
  const [overrideOpen, setOverrideOpen] = useState(false)
  const [runUseLangGraph, setRunUseLangGraph] = useState(settings.useLangGraphMultiAgent)
  const [runParallelAgents, setRunParallelAgents] = useState(settings.parallelAgentCount)

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/readybot/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          useLangGraphMultiAgent: settings.useLangGraphMultiAgent,
          parallelAgentCount: settings.parallelAgentCount,
          useLangGraphChatBrain: settings.useLangGraphChatBrain,
          automatedScanEnabled: settings.automatedScanEnabled,
          scanIntervalMinutes: settings.scanIntervalMinutes,
          automatedFollowUpEnabled: settings.automatedFollowUpEnabled,
        }),
        credentials: 'include',
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.error || 'Failed to save settings')
        return
      }
      setSettings(json.settings)
      setRunUseLangGraph(json.settings.useLangGraphMultiAgent)
      setRunParallelAgents(json.settings.parallelAgentCount)
      toast.success('ReadyBot settings saved')
    } catch {
      toast.error('Request failed')
    } finally {
      setSaving(false)
    }
  }

  const runScan = async () => {
    setRunScanBusy(true)
    try {
      const body = overrideOpen
        ? {
            useLangGraphMultiAgent: runUseLangGraph,
            parallelAgentCount: runUseLangGraph ? runParallelAgents : undefined,
          }
        : {}

      const res = await fetch('/api/readybot/run-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.error || 'Failed to start scan')
        return
      }
      toast.success('Scan started — open Live to watch logs.')
      onRunScanStarted?.()
    } catch {
      toast.error('Request failed')
    } finally {
      setRunScanBusy(false)
    }
  }

  return (
    <Card className={readybotDark.card}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Network className="h-5 w-5 text-emerald-400" aria-hidden />
          <CardTitle className="text-zinc-100">Scan &amp; automation</CardTitle>
        </div>
        <CardDescription className={readybotDark.muted}>
          Default scan behavior, Trigger.dev scheduled jobs, and manual runs — all in one place.
          Open the <strong className="text-zinc-300">Live</strong> tab to follow workflow steps.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <section className="space-y-4">
          <h3 className="text-sm font-medium text-zinc-200">Default scan behavior</h3>
          <p className={cn('text-xs', readybotDark.muted)}>
            Used by CLI (<code className="text-emerald-400/90">pnpm readybot:scan</code>), Trigger
            scheduled scans, and manual runs unless you override below.
          </p>

          <ToggleRow
            id="langgraph-toggle"
            label="LangGraph multi-agent scan"
            hint="Off = single-threaded scan. On = supervisor + parallel agents."
            checked={settings.useLangGraphMultiAgent}
            onCheckedChange={(v) => setSettings((s) => ({ ...s, useLangGraphMultiAgent: v }))}
          />

          <div className="space-y-2">
            <Label htmlFor="agent-count" className="text-zinc-200">
              Parallel scanner agents
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="agent-count"
                type="number"
                min={1}
                max={8}
                value={settings.parallelAgentCount}
                disabled={!settings.useLangGraphMultiAgent}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    parallelAgentCount: Math.min(8, Math.max(1, Number(e.target.value) || 1)),
                  }))
                }
                className="w-24 border-zinc-700 bg-zinc-900 text-zinc-100"
              />
              <span className={cn('text-xs', readybotDark.muted)}>1–8 agents</span>
            </div>
          </div>

          <ToggleRow
            id="chat-brain-toggle"
            label="LangGraph ops chat brain"
            hint="Pre-runs scan/query tools via LangGraph before streaming chat replies."
            checked={settings.useLangGraphChatBrain}
            onCheckedChange={(v) => setSettings((s) => ({ ...s, useLangGraphChatBrain: v }))}
          />
        </section>

        <section className="space-y-4 border-t border-zinc-800 pt-6">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" aria-hidden />
            <h3 className="text-sm font-medium text-zinc-200">Trigger.dev automation</h3>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 font-medium',
                  triggerStatus.envConfigured
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : 'bg-amber-500/15 text-amber-300',
                )}
              >
                {triggerStatus.envConfigured ? 'Trigger env configured' : 'Trigger env missing'}
              </span>
              {triggerStatus.projectRef ? (
                <span className={readybotDark.muted}>Project: {triggerStatus.projectRef}</span>
              ) : null}
            </div>
            <p className={cn('mt-2', readybotDark.muted)}>
              Scan scheduler ticks {describeCron(triggerStatus.scanSchedulerCron)} (
              <code className="text-zinc-400">{triggerStatus.scanSchedulerCron}</code>). Follow-ups{' '}
              {describeCron(triggerStatus.followUpSchedulerCron)}. Deploy with{' '}
              <code className="text-zinc-400">npx trigger.dev@latest deploy</code> after code
              changes.
            </p>
            {settings.lastAutomatedScanAt ? (
              <p className={cn('mt-2', readybotDark.muted)}>
                <Clock className="mr-1 inline h-3 w-3" aria-hidden />
                Last automated scan: {formatDashboardDate(settings.lastAutomatedScanAt)}
              </p>
            ) : (
              <p className={cn('mt-2', readybotDark.muted)}>No automated scan recorded yet.</p>
            )}
          </div>

          <ToggleRow
            id="automated-scan-toggle"
            label="Enable automated scan"
            hint="When off, the Trigger task exits without processing the queue."
            checked={settings.automatedScanEnabled}
            onCheckedChange={(v) => setSettings((s) => ({ ...s, automatedScanEnabled: v }))}
          />

          <div className="space-y-2">
            <Label htmlFor="scan-interval" className="text-zinc-200">
              Minimum minutes between automated scans
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="scan-interval"
                type="number"
                min={5}
                max={1440}
                value={settings.scanIntervalMinutes}
                disabled={!settings.automatedScanEnabled}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    scanIntervalMinutes: Math.min(
                      1440,
                      Math.max(5, Math.floor(Number(e.target.value) || 15)),
                    ),
                  }))
                }
                className="w-24 border-zinc-700 bg-zinc-900 text-zinc-100"
              />
              <span className={cn('text-xs', readybotDark.muted)}>
                5–1440 min (scheduler ticks every 15 min)
              </span>
            </div>
          </div>

          <ToggleRow
            id="automated-followup-toggle"
            label="Enable automated follow-ups"
            hint="Daily Trigger job for candidates awaiting reply."
            checked={settings.automatedFollowUpEnabled}
            onCheckedChange={(v) => setSettings((s) => ({ ...s, automatedFollowUpEnabled: v }))}
          />
        </section>

        <section className="space-y-4 border-t border-zinc-800 pt-6">
          <h3 className="text-sm font-medium text-zinc-200">Run scan now</h3>
          <p className={cn('text-xs', readybotDark.muted)}>
            Starts immediately using saved defaults. Does not affect automation timers.
          </p>

          <Collapsible open={overrideOpen} onOpenChange={setOverrideOpen}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto px-0 text-xs text-zinc-400 hover:text-zinc-200"
              >
                {overrideOpen ? 'Hide one-run overrides' : 'Override agents for this run only'}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-4 rounded-lg border border-zinc-800 bg-zinc-950/40 p-4">
              <ToggleRow
                id="run-langgraph-toggle"
                label="LangGraph multi-agent scan"
                hint="One-run only — does not change saved settings."
                checked={runUseLangGraph}
                onCheckedChange={setRunUseLangGraph}
              />
              <div className="space-y-2">
                <Label htmlFor="run-agent-count" className="text-zinc-200">
                  Parallel scanner agents
                </Label>
                <Input
                  id="run-agent-count"
                  type="number"
                  min={1}
                  max={8}
                  value={runParallelAgents}
                  disabled={!runUseLangGraph}
                  onChange={(e) => {
                    const n = Number(e.target.value)
                    if (!Number.isFinite(n)) return
                    setRunParallelAgents(Math.min(8, Math.max(1, Math.floor(n))))
                  }}
                  className="w-24 border-zinc-700 bg-zinc-900 text-zinc-100"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={runScan}
              disabled={runScanBusy || saving}
              className="bg-emerald-600 text-white hover:bg-emerald-500"
            >
              <Play className="mr-2 h-4 w-4" aria-hidden />
              {runScanBusy ? 'Starting…' : 'Run scan now'}
            </Button>
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-300/90">
              <Bot className="h-4 w-4 shrink-0" aria-hidden />
              Logs appear on the Live tab with a shared workflowRunId.
            </div>
          </div>
        </section>

        <Button
          onClick={save}
          disabled={saving || runScanBusy}
          className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
        >
          {saving ? 'Saving…' : 'Save settings'}
        </Button>
      </CardContent>
    </Card>
  )
}

function ToggleRow({
  id,
  label,
  hint,
  checked,
  onCheckedChange,
}: {
  id: string
  label: string
  hint: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-950/60 px-4 py-3">
      <div className="space-y-1">
        <Label htmlFor={id} className="text-zinc-200">
          {label}
        </Label>
        <p className={cn('text-xs', readybotDark.muted)}>{hint}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}
