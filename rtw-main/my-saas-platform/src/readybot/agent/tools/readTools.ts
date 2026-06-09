import { z } from 'zod'
import { getPayload } from 'payload'
import config from '@payload-config'
import { toolRegistry } from '../toolRegistry'
import { extractCvTextFromUrl } from '../../services/extractCvText'
import type { AgentContext } from '../types'

const p = () => getPayload({ config })

toolRegistry.register<{ candidateId: number }>(
  {
    name: 'read_candidate_profile',
    description: "Read a candidate's full profile from the database",
    riskLevel: 'low',
    requiredPermissionMode: 'read-only',
    requiresHumanApproval: false,
    handler: async (input, _ctx: AgentContext) => {
      const payload = await p()
      return payload.findByID({
        collection: 'candidates',
        id: input.candidateId,
        depth: 1,
        overrideAccess: true,
      })
    },
  },
  z.object({ candidateId: z.number() }),
)

toolRegistry.register<{ jobId: number }>(
  {
    name: 'read_job_profile',
    description: "Read a job posting's full profile from the database",
    riskLevel: 'low',
    requiredPermissionMode: 'read-only',
    requiresHumanApproval: false,
    handler: async (input, _ctx: AgentContext) => {
      const payload = await p()
      return payload.findByID({
        collection: 'job-postings',
        id: input.jobId,
        depth: 1,
        overrideAccess: true,
      })
    },
  },
  z.object({ jobId: z.number() }),
)

toolRegistry.register<{ candidateId: number; limit?: number }>(
  {
    name: 'read_conversation_history',
    description: 'Read recent WhatsApp messages for a candidate',
    riskLevel: 'low',
    requiredPermissionMode: 'read-only',
    requiresHumanApproval: false,
    handler: async (input, _ctx: AgentContext) => {
      const payload = await p()
      const result = await payload.find({
        collection: 'candidate-messages',
        overrideAccess: true,
        where: { candidate: { equals: input.candidateId } },
        sort: '-createdAt',
        limit: input.limit ?? 20,
      })
      return result.docs
    },
  },
  z.object({ candidateId: z.number(), limit: z.number().optional() }),
)

toolRegistry.register<{ cvUrl: string }>(
  {
    name: 'read_cv_text',
    description: "Extract and return the text content of a candidate's CV PDF",
    riskLevel: 'low',
    requiredPermissionMode: 'read-only',
    requiresHumanApproval: false,
    handler: async (input, _ctx: AgentContext) => {
      return extractCvTextFromUrl(input.cvUrl)
    },
  },
  z.object({ cvUrl: z.string() }),
)
