import { z } from 'zod'
import { getPayload } from 'payload'
import config from '@payload-config'
import { toolRegistry } from '../toolRegistry'
import type { AgentContext } from '../types'

const p = () => getPayload({ config })

toolRegistry.register<{ candidateId: number; fields: Record<string, unknown> }>(
  {
    name: 'update_candidate_profile',
    description: 'Update safe fields on a candidate profile',
    riskLevel: 'medium',
    requiredPermissionMode: 'workspace-write',
    requiresHumanApproval: false,
    handler: async (input, _ctx: AgentContext) => {
      const payload = await p()
      return payload.update({
        collection: 'candidates',
        id: input.candidateId,
        overrideAccess: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: input.fields as any,
      })
    },
  },
  z.object({ candidateId: z.number(), fields: z.record(z.string(), z.unknown()) }),
)

toolRegistry.register<{
  candidateId: number
  taskId: number
  answer: string
  field: string
}>(
  {
    name: 'save_screening_answer',
    description: 'Save a screening answer extracted from a candidate reply',
    riskLevel: 'medium',
    requiredPermissionMode: 'workspace-write',
    requiresHumanApproval: false,
    handler: async (input, _ctx: AgentContext) => {
      const payload = await p()
      const task = await payload.findByID({
        collection: 'candidate-screening-tasks',
        id: input.taskId,
        overrideAccess: true,
      })
      const extractedData = ((task as unknown as Record<string, unknown>).extractedData ?? {}) as Record<
        string,
        unknown
      >
      extractedData[input.field] = input.answer
      return payload.update({
        collection: 'candidate-screening-tasks',
        id: input.taskId,
        overrideAccess: true,
        data: { extractedData },
      })
    },
  },
  z.object({
    candidateId: z.number(),
    taskId: z.number(),
    answer: z.string(),
    field: z.string(),
  }),
)

toolRegistry.register<{ resultId: number; fitScore: number; fitSummary: string }>(
  {
    name: 'update_candidate_score',
    description: "Update a candidate's role-fit score and summary",
    riskLevel: 'medium',
    requiredPermissionMode: 'workspace-write',
    requiresHumanApproval: false,
    handler: async (input, _ctx: AgentContext) => {
      const payload = await p()
      return payload.update({
        collection: 'screening-results',
        id: input.resultId,
        overrideAccess: true,
        data: { fitScore: input.fitScore, fitSummary: input.fitSummary },
      })
    },
  },
  z.object({
    resultId: z.number(),
    fitScore: z.number().min(0).max(100),
    fitSummary: z.string(),
  }),
)

toolRegistry.register<{
  candidateId: number
  profileSummary: string
  cvSummary?: string
}>(
  {
    name: 'create_candidate_summary',
    description: 'Upsert the AI-generated summary in candidate memory',
    riskLevel: 'medium',
    requiredPermissionMode: 'workspace-write',
    requiresHumanApproval: false,
    handler: async (input, _ctx: AgentContext) => {
      const payload = await p()
      const existing = await payload.find({
        collection: 'candidate-memory',
        overrideAccess: true,
        where: { candidate: { equals: input.candidateId } },
        limit: 1,
      })
      const patch = {
        profileSummary: input.profileSummary,
        ...(input.cvSummary ? { cvSummary: input.cvSummary } : {}),
      }
      if (existing.docs[0]) {
        return payload.update({
          collection: 'candidate-memory',
          id: existing.docs[0].id,
          overrideAccess: true,
          data: patch,
        })
      }
      return payload.create({
        collection: 'candidate-memory',
        overrideAccess: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { candidate: input.candidateId, ...patch } as any,
      })
    },
  },
  z.object({
    candidateId: z.number(),
    profileSummary: z.string(),
    cvSummary: z.string().optional(),
  }),
)

toolRegistry.register<{ candidateId: number; memoryPatch: Record<string, unknown> }>(
  {
    name: 'save_memory',
    description: 'Persist a memory patch to the candidate-memory collection',
    riskLevel: 'medium',
    requiredPermissionMode: 'workspace-write',
    requiresHumanApproval: false,
    handler: async (input, _ctx: AgentContext) => {
      const payload = await p()
      const existing = await payload.find({
        collection: 'candidate-memory',
        overrideAccess: true,
        where: { candidate: { equals: input.candidateId } },
        limit: 1,
      })
      if (existing.docs[0]) {
        return payload.update({
          collection: 'candidate-memory',
          id: existing.docs[0].id,
          overrideAccess: true,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data: input.memoryPatch as any,
        })
      }
      return payload.create({
        collection: 'candidate-memory',
        overrideAccess: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { candidate: input.candidateId, ...input.memoryPatch } as any,
      })
    },
  },
  z.object({ candidateId: z.number(), memoryPatch: z.record(z.string(), z.unknown()) }),
)

toolRegistry.register<{
  candidateId: number
  jobId?: number
  missingFields?: string[]
}>(
  {
    name: 'create_agent_task',
    description: 'Create a screening task record for a candidate',
    riskLevel: 'medium',
    requiredPermissionMode: 'workspace-write',
    requiresHumanApproval: false,
    handler: async (input, _ctx: AgentContext) => {
      const payload = await p()
      return payload.create({
        collection: 'candidate-screening-tasks',
        overrideAccess: true,
        data: {
          candidate: input.candidateId,
          ...(input.jobId ? { jobPosting: input.jobId } : {}),
          status: 'pending',
          channel: 'whatsapp',
          missingFields: (input.missingFields ?? []).map((f) => ({ field: f })),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      })
    },
  },
  z.object({
    candidateId: z.number(),
    jobId: z.number().optional(),
    missingFields: z.array(z.string()).optional(),
  }),
)

toolRegistry.register<{
  taskId: number
  status?: string
  extractedData?: Record<string, unknown>
}>(
  {
    name: 'update_agent_task',
    description: 'Update status or extracted data on an existing screening task',
    riskLevel: 'medium',
    requiredPermissionMode: 'workspace-write',
    requiresHumanApproval: false,
    handler: async (input, _ctx: AgentContext) => {
      const payload = await p()
      return payload.update({
        collection: 'candidate-screening-tasks',
        id: input.taskId,
        overrideAccess: true,
        data: {
          ...(input.status ? { status: input.status } : {}),
          ...(input.extractedData ? { extractedData: input.extractedData } : {}),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      })
    },
  },
  z.object({
    taskId: z.number(),
    status: z.string().optional(),
    extractedData: z.record(z.string(), z.unknown()).optional(),
  }),
)
