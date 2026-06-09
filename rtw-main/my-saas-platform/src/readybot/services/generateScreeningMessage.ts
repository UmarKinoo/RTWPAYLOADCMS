import type { Candidate } from '@/payload-types'
import type { MissingFieldCheck } from './detectMissingFields'
import { generateScreeningMessageWithLlm, isLlmConfigured } from '../tools/llmTool'
import type { WorkflowTrace } from '../tools/workflowTrace'

export type GenerateMessageOptions = {
  fitSummary?: string
  recommendedQuestions?: string[]
  recentMessages?: { direction: 'inbound' | 'outbound'; body: string }[]
  memorySummary?: string
  cvSummary?: string
  trace?: WorkflowTrace
}

/** LLM when configured; otherwise static template. */
export async function generateScreeningMessage(
  candidate: Candidate,
  missing: MissingFieldCheck[],
  options: GenerateMessageOptions = {},
): Promise<{ messageBody: string; messageTemplate?: string }> {
  const trace = options.trace
  const name = candidate.firstName?.trim() || 'there'
  const template = process.env.READYBOT_WHATSAPP_TEMPLATE_NAME || 'profile_completion_v1'

  if (isLlmConfigured()) {
    const llm = trace
      ? await trace.runTool({
          step: 'Generate tailored outreach message',
          toolUsed: 'generateScreeningMessageWithLlm',
          fn: () =>
            generateScreeningMessageWithLlm({
              candidateName: name,
              missingFields: missing.map((m) => m.label),
              recommendedQuestions: options.recommendedQuestions ?? [],
              fitSummary: options.fitSummary,
              recentMessages: options.recentMessages,
              memorySummary: options.memorySummary,
              cvSummary: options.cvSummary,
            }),
          resultDetail: (r) => ({ success: r.success }),
        })
      : await generateScreeningMessageWithLlm({
          candidateName: name,
          missingFields: missing.map((m) => m.label),
          recommendedQuestions: options.recommendedQuestions ?? [],
          fitSummary: options.fitSummary,
          recentMessages: options.recentMessages,
          memorySummary: options.memorySummary,
          cvSummary: options.cvSummary,
        })
    if (llm.success && llm.messageBody) {
      return { messageBody: llm.messageBody, messageTemplate: template }
    }
    await trace?.log({
      step: 'LLM message empty — using static template',
      toolUsed: 'generateScreeningMessageWithLlm',
      status: 'skipped',
    })
  }

  const fieldsList = missing.map((m) => m.label).join(', ')
  const questions = (options.recommendedQuestions ?? []).slice(0, 3).join(' ')
  const fit = options.fitSummary ? ` ${options.fitSummary}` : ''
  const messageBody =
    `Hi ${name}, this is Ready to Work.${fit} ` +
    (questions || `Could you share: ${fieldsList}?`) +
    ` Reply STOP to opt out.`

  return { messageBody, messageTemplate: template }
}
