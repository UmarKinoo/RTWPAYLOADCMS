import { runFollowUpWorkflow } from '@/readybot/workflows/followUpWorkflow'

/** Phase 5: Trigger.dev daily schedule */
export async function sendFollowUps() {
  return runFollowUpWorkflow()
}
