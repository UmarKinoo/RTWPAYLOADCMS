import { getPayload } from 'payload'
import config from '@payload-config'
import type { ContextBundle, AgentContext, CompactedMemory } from './types'

const READYBOT_SYSTEM_INSTRUCTIONS = `You are ReadyBot, an AI recruitment assistant for ReadyToWork.
Your role is to screen candidates, gather missing profile information, and assist recruiters.
You MUST recommend actions — never make final hiring decisions automatically.
Always be respectful, concise, and professional.`

export class ContextManager {
  private async p() {
    return getPayload({ config })
  }

  async buildContext(agentCtx: AgentContext): Promise<ContextBundle> {
    const payload = await this.p()

    const [candidateProfile, jobProfile, recentMessages, memory] = await Promise.all([
      agentCtx.candidateId ? this.fetchCandidate(payload, agentCtx.candidateId) : Promise.resolve(null),
      agentCtx.jobId ? this.fetchJob(payload, agentCtx.jobId) : Promise.resolve(null),
      agentCtx.candidateId ? this.fetchRecentMessages(payload, agentCtx.candidateId) : Promise.resolve([]),
      agentCtx.candidateId ? this.fetchMemory(payload, agentCtx.candidateId) : Promise.resolve(null),
    ])

    const compactedMemory = memory ? this.buildCompactedMemory(memory) : null
    const missingInformation = this.extractMissingFields(candidateProfile)

    return {
      systemInstructions: READYBOT_SYSTEM_INSTRUCTIONS,
      candidateProfile,
      jobProfile,
      recentMessages,
      conversationSummary: (memory as Record<string, unknown> | null)?.conversationSummary as string ?? '',
      currentTaskState: this.detectStage(candidateProfile, missingInformation),
      missingInformation,
      previousDecisions: this.extractDecisions(memory),
      allowedTools: agentCtx.allowedTools ?? [],
      permissionMode: agentCtx.permissionMode,
      compactedMemory,
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async fetchCandidate(payload: any, id: string | number) {
    try {
      return payload.findByID({ collection: 'candidates', id: Number(id), depth: 1, overrideAccess: true })
    } catch { return null }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async fetchJob(payload: any, id: string | number) {
    try {
      return payload.findByID({ collection: 'job-postings', id: Number(id), depth: 1, overrideAccess: true })
    } catch { return null }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async fetchRecentMessages(payload: any, candidateId: string | number) {
    try {
      const result = await payload.find({
        collection: 'candidate-messages',
        overrideAccess: true,
        where: { candidate: { equals: Number(candidateId) } },
        sort: '-createdAt',
        limit: 10,
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (result.docs as any[]).reverse().map((m: any) => ({
        role: m.direction === 'inbound' ? 'candidate' : 'bot',
        content: String(m.body ?? m.messageBody ?? ''),
        timestamp: m.createdAt as string | undefined,
      }))
    } catch { return [] }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async fetchMemory(payload: any, candidateId: string | number) {
    try {
      const result = await payload.find({
        collection: 'candidate-memory',
        overrideAccess: true,
        where: { candidate: { equals: Number(candidateId) } },
        limit: 1,
      })
      return result.docs[0] ?? null
    } catch { return null }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private buildCompactedMemory(memory: any): CompactedMemory {
    return {
      candidate_summary: String(memory.profileSummary ?? ''),
      job_summary: '',
      conversation_summary: String(memory.conversationSummary ?? ''),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      important_facts: (memory.confirmedFields ?? []).map((f: any) => String(f.field ?? f)),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      open_questions: (memory.missingFields ?? []).map((f: any) => String(f.field ?? f)),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      contradictions: (memory.importantCorrections ?? []).map((c: any) => String(c.correction ?? c)),
      current_stage: String(memory.lastAgentDecision ?? 'screening'),
      next_recommended_action: memory.lastQuestionAsked
        ? `Follow up on: ${memory.lastQuestionAsked}`
        : 'Begin screening',
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractMissingFields(candidate: any): string[] {
    if (!candidate) return []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (candidate.missingFields ?? []).map((f: any) => String(f.field ?? f))
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private detectStage(candidate: any, missingFields: string[]): string {
    if (!candidate) return 'unknown'
    if (candidate.screeningStatus === 'completed') return 'completed'
    if (candidate.screeningStatus === 'needs_human_review') return 'human_review'
    if (missingFields.length === 0) return 'role_fit_comparison'
    return `gathering_missing_info (${missingFields.length} fields remaining)`
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractDecisions(memory: any): string[] {
    if (!memory) return []
    const out: string[] = []
    if (memory.lastAgentDecision) out.push(String(memory.lastAgentDecision))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (Array.isArray(memory.riskFlags)) out.push(...memory.riskFlags.map((f: any) => `Risk: ${String(f.flag ?? f)}`))
    return out
  }

  /** Serialise a ContextBundle into a prompt string for LLM consumption. */
  formatContextAsPrompt(bundle: ContextBundle): string {
    const parts: string[] = [bundle.systemInstructions, '']

    if (bundle.candidateProfile) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const c = bundle.candidateProfile as any
      parts.push('## Candidate Profile')
      parts.push(`Name: ${c.fullName ?? c.firstName ?? 'Unknown'}`)
      parts.push(`Job Title: ${c.jobTitle ?? 'N/A'}`)
      parts.push(`Experience: ${c.experienceYears ?? 'N/A'} years`)
      parts.push(`Location: ${c.location ?? 'N/A'}`)
      parts.push(`WhatsApp: ${c.whatsappNumber ?? c.readyBot?.whatsappNumber ?? 'N/A'}`)
      parts.push(`Status: ${c.screeningStatus ?? 'N/A'}`)
      parts.push('')
    }

    if (bundle.compactedMemory) {
      const m = bundle.compactedMemory
      parts.push('## Memory')
      if (m.candidate_summary) parts.push(`Summary: ${m.candidate_summary}`)
      if (m.conversation_summary) parts.push(`Conversation: ${m.conversation_summary}`)
      if (m.important_facts.length) parts.push(`Confirmed: ${m.important_facts.join(', ')}`)
      if (m.open_questions.length) parts.push(`Missing: ${m.open_questions.join(', ')}`)
      if (m.contradictions.length) parts.push(`Corrections: ${m.contradictions.join(', ')}`)
      parts.push(`Stage: ${m.current_stage}`)
      parts.push(`Next: ${m.next_recommended_action}`)
      parts.push('')
    }

    if (bundle.recentMessages.length > 0) {
      parts.push('## Recent Messages')
      bundle.recentMessages.slice(-5).forEach((m) => {
        parts.push(`[${m.role.toUpperCase()}]: ${m.content}`)
      })
      parts.push('')
    }

    parts.push(`## Permission Mode: ${bundle.permissionMode}`)
    if (bundle.allowedTools.length > 0) {
      parts.push(`Allowed tools: ${bundle.allowedTools.join(', ')}`)
    }

    return parts.join('\n')
  }
}

export const contextManager = new ContextManager()
