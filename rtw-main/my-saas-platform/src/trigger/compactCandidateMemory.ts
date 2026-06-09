import { runMemoryCompactionWorkflow } from '@/readybot/workflows/memoryCompactionWorkflow'

/** Phase 5: run after meaningful inbound reply */
export async function compactCandidateMemoryJob(candidateId: string | number) {
  return runMemoryCompactionWorkflow(candidateId)
}
