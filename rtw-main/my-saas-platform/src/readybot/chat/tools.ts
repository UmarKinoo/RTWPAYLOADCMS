import { tool } from 'ai'
import { z } from 'zod'
import type { Payload } from 'payload'
import {
  executeFindCandidate,
  executeListCandidates,
  executeGetCandidateProfile,
  executeGetPipelineStats,
  executeListPendingReviews,
  executeRunScan,
  executeUpdateCandidateProfile,
} from './toolActions'
import { CHAT_LIST_MAX_ROWS } from './chatGuards'
import { permissionEngine } from '@/readybot/agent/permissionEngine'
import { agentEventService } from '@/readybot/agent/agentEventService'

export function createReadyBotChatTools(
  payload: Payload,
  locale: string,
  adminUserId: string | number,
  options?: { allowRunScan?: boolean; allowListCandidates?: boolean; sessionId?: string | number | null },
) {
  const allowRunScan = options?.allowRunScan !== false
  const allowListCandidates = options?.allowListCandidates !== false
  const sessionId = options?.sessionId ?? null

  const runScanTool = tool({
    description:
      'Run the ReadyBot candidate scan now (LangGraph multi-agent when enabled in settings). Only use when the admin explicitly asks to run/start/trigger a scan — never on vague messages.',
    inputSchema: z.object({}),
    execute: async () => executeRunScan(),
  })

  return {
    ...(allowRunScan ? { runScan: runScanTool } : {}),

    listPendingReviews: tool({
      description: 'List pending human-review tasks waiting for admin approval.',
      inputSchema: z.object({
        limit: z.number().int().min(1).max(20).optional().describe('Max rows (default 10)'),
      }),
      execute: async ({ limit }) => {
        const rows = await executeListPendingReviews(payload, limit ?? 10)
        return { count: rows.length, reviews: rows }
      },
    }),

    getPipelineStats: tool({
      description:
        'Get ReadyBot pipeline counts: pending reviews, active tasks, screening results, agent settings.',
      inputSchema: z.object({}),
      execute: async () => executeGetPipelineStats(payload),
    }),

    ...(allowListCandidates
      ? {
          listCandidates: tool({
            description: `Small ReadyBot pipeline slice only (max ${CHAT_LIST_MAX_ROWS} compact rows). Not for browsing thousands — use when admin specified count/status filter. For large sets, tool returns bulkBrowse redirect to Payload Admin.`,
            inputSchema: z.object({
              limit: z
                .number()
                .int()
                .min(1)
                .max(CHAT_LIST_MAX_ROWS)
                .optional()
                .describe(`Max rows (default 5, hard max ${CHAT_LIST_MAX_ROWS})`),
              page: z.number().int().min(1).optional().describe('Page number (default 1)'),
              screeningStatus: z
                .string()
                .optional()
                .describe(
                  'Filter: new, incomplete, verified, contacted, info_received, needs_human_review',
                ),
              pipelineOnly: z
                .boolean()
                .optional()
                .describe('Default true — only ReadyBot pipeline candidates'),
            }),
            execute: async ({ limit, page, screeningStatus, pipelineOnly }) =>
              executeListCandidates(payload, locale, {
                limit: limit ?? 5,
                page: page ?? 1,
                screeningStatus,
                pipelineOnly,
              }),
          }),
        }
      : {}),

    findCandidate: tool({
      description:
        'Search candidates by full name (e.g. "Reply Pending"), email, or job title. Returns dashboardLinkLine per match — paste those lines into your reply.',
      inputSchema: z.object({
        query: z.string().min(1).describe('Full name, email fragment, or job title'),
      }),
      execute: async ({ query }) => executeFindCandidate(payload, query, locale),
    }),

    getCandidateProfile: tool({
      description:
        'Load full candidate details: name, contact, profile, ReadyBot status, agent memory, latest screening result, recent WhatsApp messages, and screening tasks. Always use this when the admin asks about a specific candidate.',
      inputSchema: z.object({
        candidateId: z.number().int().positive().describe('Candidate ID from findCandidate or listCandidates'),
      }),
      execute: async ({ candidateId }) => executeGetCandidateProfile(payload, candidateId, locale),
    }),

    updateCandidateProfile: tool({
      description:
        'Propose and apply profile field changes for a candidate. MUST call without adminConfirmed first to show proposed changes. Only set adminConfirmed: true after the admin explicitly says yes/confirm/approve.',
      inputSchema: z.object({
        candidateId: z.number().int().positive().describe('Candidate ID'),
        reason: z.string().optional().describe('Short note for the audit log'),
        fields: z
          .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
          .describe('Fields to update, e.g. jobTitle, location, aboutMe, experienceYears'),
        adminConfirmed: z
          .boolean()
          .optional()
          .describe('Set to true ONLY after admin explicitly said yes/confirm/approve in this conversation'),
      }),
      execute: async (input) => {
        const meta = { candidateId: String(input.candidateId), sessionId: sessionId ? String(sessionId) : undefined }

        // Gate: require explicit admin confirmation before any write
        if (!input.adminConfirmed) {
          void agentEventService.recordEvent(
            'permission_decision',
            { tool: 'update_candidate_profile', granted: false, requiresApproval: true, mode: 'ask-before-edit', reason: 'Awaiting admin confirmation' },
            meta,
          )
          return {
            requiresApproval: true,
            candidateId: input.candidateId,
            proposedChanges: input.fields,
            reason: input.reason ?? null,
            instruction: 'Show the proposed changes to the admin and ask them to confirm. Do NOT call this tool with adminConfirmed: true until they explicitly say yes/confirm/approve.',
          }
        }

        // Admin confirmed — record and execute
        void agentEventService.recordEvent(
          'permission_decision',
          { tool: 'update_candidate_profile', granted: true, mode: 'ask-before-edit', adminConfirmed: true },
          meta,
        )
        return executeUpdateCandidateProfile(payload, input, adminUserId)
      },
    }),
  }
}
