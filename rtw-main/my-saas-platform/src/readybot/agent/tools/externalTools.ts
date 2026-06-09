import { z } from 'zod'
import { toolRegistry } from '../toolRegistry'
import { sendWhatsAppMessage } from '../../tools/whatsappTool'
import type { AgentContext } from '../types'

toolRegistry.register<{ to: string; body: string; candidateId: number }>(
  {
    name: 'send_whatsapp_message',
    description:
      'Send a WhatsApp message to a candidate. Requires human approval unless in danger-full-access mode.',
    riskLevel: 'high',
    requiredPermissionMode: 'ask-before-edit',
    requiresHumanApproval: true,
    handler: async (input, _ctx: AgentContext) => {
      return sendWhatsAppMessage({ to: input.to, body: input.body })
    },
  },
  z.object({ to: z.string(), body: z.string(), candidateId: z.number() }),
)

toolRegistry.register<{
  recruiterId?: number
  message: string
  candidateId?: number
}>(
  {
    name: 'notify_recruiter',
    description: 'Notify a recruiter via email or Slack about a candidate update.',
    riskLevel: 'high',
    requiredPermissionMode: 'ask-before-edit',
    requiresHumanApproval: true,
    handler: async (input, _ctx: AgentContext) => {
      // Placeholder — integrate with email/Slack adapter
      console.log('[notify_recruiter]', input.message, 'for candidate', input.candidateId)
      return { notified: true, message: input.message }
    },
  },
  z.object({
    recruiterId: z.number().optional(),
    message: z.string(),
    candidateId: z.number().optional(),
  }),
)

toolRegistry.register<{
  phone: string
  candidateId: number
  taskDescription?: string
}>(
  {
    name: 'schedule_bland_call',
    description: 'Schedule a Bland AI phone screening call for a candidate.',
    riskLevel: 'high',
    requiredPermissionMode: 'ask-before-edit',
    requiresHumanApproval: true,
    handler: async (input, _ctx: AgentContext) => {
      // Placeholder — integrate with Bland.ai SDK
      console.log('[schedule_bland_call] Would call:', input.phone)
      return { scheduled: true, phone: input.phone }
    },
  },
  z.object({
    phone: z.string(),
    candidateId: z.number(),
    taskDescription: z.string().optional(),
  }),
)

toolRegistry.register<{ candidateId: number; status: string; reason?: string }>(
  {
    name: 'change_candidate_status',
    description: "Change a candidate's screeningStatus field. Requires human approval.",
    riskLevel: 'high',
    requiredPermissionMode: 'ask-before-edit',
    requiresHumanApproval: true,
    handler: async (input, _ctx: AgentContext) => {
      const { getPayload } = await import('payload')
      const payloadConfig = (await import('@payload-config')).default
      const payload = await getPayload({ config: payloadConfig })
      return payload.update({
        collection: 'candidates',
        id: input.candidateId,
        overrideAccess: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { screeningStatus: input.status } as any,
      })
    },
  },
  z.object({
    candidateId: z.number(),
    status: z.string(),
    reason: z.string().optional(),
  }),
)
