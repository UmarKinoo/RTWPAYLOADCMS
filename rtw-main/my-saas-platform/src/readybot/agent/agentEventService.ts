import { getPayload } from 'payload'
import config from '@payload-config'
import type { EventType, AgentEventMetadata } from './types'

export class AgentEventService {
  private async client() {
    return getPayload({ config })
  }

  async recordEvent(
    eventType: EventType,
    payload: Record<string, unknown>,
    metadata: AgentEventMetadata = {},
  ): Promise<void> {
    try {
      const p = await this.client()
      await p.create({
        collection: 'agent-events',
        overrideAccess: true,
        data: {
          event_type: eventType,
          ...(metadata.candidateId != null ? { candidate: Number(metadata.candidateId) } : {}),
          ...(metadata.jobId != null ? { job: Number(metadata.jobId) } : {}),
          conversation_id: metadata.conversationId,
          session_id: metadata.sessionId,
          payload,
        },
      })
    } catch (err) {
      console.error('[AgentEventService] Failed to record event:', eventType, err)
    }
  }

  async getEventsForCandidate(candidateId: string | number, limit = 100) {
    try {
      const p = await this.client()
      const result = await p.find({
        collection: 'agent-events',
        overrideAccess: true,
        where: { candidate: { equals: Number(candidateId) } },
        sort: '-createdAt',
        limit,
      })
      return result.docs
    } catch (err) {
      console.error('[AgentEventService] Failed to get candidate events:', err)
      return []
    }
  }

  async getRecentEvents(candidateId: string | number, limit = 20) {
    return this.getEventsForCandidate(candidateId, limit)
  }

  async getSessionTimeline(sessionId: string) {
    try {
      const p = await this.client()
      const result = await p.find({
        collection: 'agent-events',
        overrideAccess: true,
        where: { session_id: { equals: sessionId } },
        sort: 'createdAt',
        limit: 500,
      })
      return result.docs
    } catch (err) {
      console.error('[AgentEventService] Failed to get session timeline:', err)
      return []
    }
  }
}

export const agentEventService = new AgentEventService()
