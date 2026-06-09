export type ReadyBotTriggerStatus = {
  envConfigured: boolean
  projectRef: string | null
  /** Trigger.dev cron tick (deploy-time); runtime interval is controlled in settings. */
  scanSchedulerCron: string
  followUpSchedulerCron: string
}

export function getReadyBotTriggerStatus(): ReadyBotTriggerStatus {
  const projectRef = process.env.TRIGGER_PROJECT_REF?.trim() || null
  const secretKey = process.env.TRIGGER_SECRET_KEY?.trim()

  return {
    envConfigured: Boolean(projectRef && secretKey),
    projectRef,
    scanSchedulerCron: '*/15 * * * *',
    followUpSchedulerCron: '0 9 * * *',
  }
}

export function describeCron(cron: string): string {
  if (cron === '*/15 * * * *') return 'every 15 minutes'
  if (cron === '0 9 * * *') return 'daily at 09:00 UTC'
  return cron
}
