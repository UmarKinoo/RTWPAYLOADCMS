import type { Payload } from 'payload'

export type ReadyBotRuntimeSettings = {
  useLangGraphMultiAgent: boolean
  parallelAgentCount: number
  useLangGraphChatBrain: boolean
  automatedScanEnabled: boolean
  scanIntervalMinutes: number
  automatedFollowUpEnabled: boolean
  lastAutomatedScanAt: string | null
  lastAutomatedFollowUpAt: string | null
  useAgenticReply: boolean
}

export const DEFAULT_READYBOT_SETTINGS: ReadyBotRuntimeSettings = {
  useLangGraphMultiAgent: true,
  parallelAgentCount: 3,
  useLangGraphChatBrain: true,
  automatedScanEnabled: true,
  scanIntervalMinutes: 15,
  automatedFollowUpEnabled: true,
  lastAutomatedScanAt: null,
  lastAutomatedFollowUpAt: null,
  useAgenticReply: false,
}

type ReadyBotSettingsDoc = {
  useLangGraphMultiAgent?: boolean | null
  parallelAgentCount?: number | null
  useLangGraphChatBrain?: boolean | null
  automatedScanEnabled?: boolean | null
  scanIntervalMinutes?: number | null
  automatedFollowUpEnabled?: boolean | null
  lastAutomatedScanAt?: string | null
  lastAutomatedFollowUpAt?: string | null
}

function normalizeSettings(doc: ReadyBotSettingsDoc): ReadyBotRuntimeSettings {
  const count = Number(doc.parallelAgentCount)
  const interval = Number(doc.scanIntervalMinutes)

  return {
    useLangGraphMultiAgent: doc.useLangGraphMultiAgent !== false,
    parallelAgentCount: Number.isFinite(count)
      ? Math.min(8, Math.max(1, count))
      : DEFAULT_READYBOT_SETTINGS.parallelAgentCount,
    useLangGraphChatBrain: doc.useLangGraphChatBrain !== false,
    automatedScanEnabled: doc.automatedScanEnabled !== false,
    scanIntervalMinutes: Number.isFinite(interval)
      ? Math.min(1440, Math.max(5, Math.floor(interval)))
      : DEFAULT_READYBOT_SETTINGS.scanIntervalMinutes,
    automatedFollowUpEnabled: doc.automatedFollowUpEnabled !== false,
    lastAutomatedScanAt: doc.lastAutomatedScanAt ?? null,
    lastAutomatedFollowUpAt: doc.lastAutomatedFollowUpAt ?? null,
    useAgenticReply: (doc as ReadyBotSettingsDoc & { useAgenticReply?: boolean | null }).useAgenticReply === true,
  }
}

export async function loadReadyBotSettings(
  payload: Payload,
): Promise<ReadyBotRuntimeSettings> {
  try {
    const doc = (await payload.findGlobal({
      slug: 'ready-bot-settings' as never,
      overrideAccess: true,
    })) as ReadyBotSettingsDoc
    return normalizeSettings(doc)
  } catch {
    return { ...DEFAULT_READYBOT_SETTINGS }
  }
}

export async function saveReadyBotSettings(
  payload: Payload,
  settings: Partial<
    Omit<ReadyBotRuntimeSettings, 'lastAutomatedScanAt' | 'lastAutomatedFollowUpAt'>
  >,
): Promise<ReadyBotRuntimeSettings> {
  const current = await loadReadyBotSettings(payload)
  const next: ReadyBotRuntimeSettings = {
    ...current,
    useLangGraphMultiAgent:
      settings.useLangGraphMultiAgent ?? current.useLangGraphMultiAgent,
    parallelAgentCount:
      settings.parallelAgentCount ?? current.parallelAgentCount,
    useLangGraphChatBrain:
      settings.useLangGraphChatBrain ?? current.useLangGraphChatBrain,
    automatedScanEnabled:
      settings.automatedScanEnabled ?? current.automatedScanEnabled,
    scanIntervalMinutes:
      settings.scanIntervalMinutes ?? current.scanIntervalMinutes,
    automatedFollowUpEnabled:
      settings.automatedFollowUpEnabled ?? current.automatedFollowUpEnabled,
  }
  next.parallelAgentCount = Math.min(8, Math.max(1, next.parallelAgentCount))
  next.scanIntervalMinutes = Math.min(1440, Math.max(5, Math.floor(next.scanIntervalMinutes)))

  await payload.updateGlobal({
    slug: 'ready-bot-settings' as never,
    data: {
      useLangGraphMultiAgent: next.useLangGraphMultiAgent,
      parallelAgentCount: next.parallelAgentCount,
      useLangGraphChatBrain: next.useLangGraphChatBrain,
      automatedScanEnabled: next.automatedScanEnabled,
      scanIntervalMinutes: next.scanIntervalMinutes,
      automatedFollowUpEnabled: next.automatedFollowUpEnabled,
    } as never,
    overrideAccess: true,
  })

  return next
}

export function shouldRunScheduledScan(
  settings: ReadyBotRuntimeSettings,
  now = Date.now(),
): { run: boolean; reason?: string } {
  if (!settings.automatedScanEnabled) {
    return { run: false, reason: 'Automated scan disabled in dashboard settings' }
  }
  if (!settings.lastAutomatedScanAt) {
    return { run: true }
  }
  const last = new Date(settings.lastAutomatedScanAt).getTime()
  if (!Number.isFinite(last)) {
    return { run: true }
  }
  const elapsedMs = now - last
  const requiredMs = settings.scanIntervalMinutes * 60 * 1000
  if (elapsedMs < requiredMs) {
    return {
      run: false,
      reason: `Interval not elapsed (${settings.scanIntervalMinutes} min between runs)`,
    }
  }
  return { run: true }
}

export async function recordAutomatedScanRun(payload: Payload): Promise<void> {
  await payload.updateGlobal({
    slug: 'ready-bot-settings' as never,
    data: { lastAutomatedScanAt: new Date().toISOString() } as never,
    overrideAccess: true,
  })
}

export async function recordAutomatedFollowUpRun(payload: Payload): Promise<void> {
  await payload.updateGlobal({
    slug: 'ready-bot-settings' as never,
    data: { lastAutomatedFollowUpAt: new Date().toISOString() } as never,
    overrideAccess: true,
  })
}
