import type { CandidateExtraction } from '../types/CandidateExtraction'
import { extractCandidateDataWithLlm, isLlmConfigured } from '../tools/llmTool'
import type { WorkflowTrace } from '../tools/workflowTrace'

export async function parseCandidateReply(
  args: {
    replyText: string
    missingFields: string[]
    memorySummary?: string
    candidateProfile?: Record<string, unknown>
    trace?: WorkflowTrace
  },
): Promise<CandidateExtraction | null> {
  const trace = args.trace
  if (!isLlmConfigured()) {
    await trace?.log({
      step: 'Reply parse skipped — no LLM',
      toolUsed: 'extractCandidateDataWithLlm',
      status: 'skipped',
    })
    return null
  }

  const res = trace
    ? await trace.runTool({
        step: 'Extract structured fields from reply',
        toolUsed: 'extractCandidateDataWithLlm',
        fn: () =>
          extractCandidateDataWithLlm({
            message: args.replyText,
            context: {
              missingFields: args.missingFields,
              memorySummary: args.memorySummary,
              profile: args.candidateProfile,
            },
          }),
        resultDetail: (r) => ({
          success: r.success,
          confidence: r.extraction?.confidence,
          fieldCount: r.extraction ? Object.keys(r.extraction.fields).length : 0,
        }),
      })
    : await extractCandidateDataWithLlm({
        message: args.replyText,
        context: {
          missingFields: args.missingFields,
          memorySummary: args.memorySummary,
          profile: args.candidateProfile,
        },
      })

  return res.success ? res.extraction ?? null : null
}
