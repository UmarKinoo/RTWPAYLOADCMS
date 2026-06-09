import type { ReadyBotPayloadContext } from '../tools/payloadTool'
import { getCandidate } from '../tools/payloadTool'
import { compareRoleFitWithLlm, summarizeCvWithLlm, isLlmConfigured } from '../tools/llmTool'
import { extractCvTextFromUrl } from './extractCvText'
import { buildCandidateProfileContext, getResumeMediaUrl } from './buildCandidateProfileContext'
import { getReadyBotModel } from '../lib/openaiClient'
import type { RoleFitResult } from '../types/RoleFitResult'
import type { WorkflowTrace } from '../tools/workflowTrace'

export async function buildCvSummary(
  ctx: ReadyBotPayloadContext,
  candidateId: string | number,
  trace?: WorkflowTrace,
): Promise<string> {
  const candidate = await getCandidate(ctx, candidateId)
  const url = getResumeMediaUrl(candidate)
  if (!url) {
    await trace?.log({
      step: 'No resume file on candidate',
      toolUsed: 'getResumeMediaUrl',
      status: 'skipped',
    })
    return ''
  }
  try {
    const text = trace
      ? await trace.runTool({
          step: 'Extract text from CV file',
          toolUsed: 'extractCvTextFromUrl',
          fn: () => extractCvTextFromUrl(url),
          resultDetail: (t) => ({ charCount: t.length }),
        })
      : await extractCvTextFromUrl(url)
    if (!text) {
      await trace?.log({
        step: 'CV extract returned empty',
        toolUsed: 'extractCvTextFromUrl',
        status: 'skipped',
      })
      return ''
    }
    if (isLlmConfigured()) {
      const sum = trace
        ? await trace.runTool({
            step: 'Summarize CV with LLM',
            toolUsed: 'summarizeCvWithLlm',
            fn: () => summarizeCvWithLlm(text),
            resultDetail: (r) => ({ ok: r.success }),
          })
        : await summarizeCvWithLlm(text)
      if (sum.success && sum.summary) return sum.summary
      await trace?.log({
        step: 'CV LLM summary empty — using raw text',
        toolUsed: 'summarizeCvWithLlm',
        status: 'skipped',
      })
    }
    return text.slice(0, 4000)
  } catch (e) {
    await trace?.log({
      step: 'CV pipeline error',
      toolUsed: 'buildCvSummary',
      status: 'error',
      errorMessage: e instanceof Error ? e.message : String(e),
    })
    return ''
  }
}

export async function compareCandidateToRole(
  ctx: ReadyBotPayloadContext,
  args: {
    candidateId: string | number
    jobPostingId?: string | number
    targetRoleTitle?: string
    cvSummary?: string
    trace?: WorkflowTrace
  },
): Promise<{ success: boolean; result?: RoleFitResult; jobTitle: string; error?: string }> {
  const trace = args.trace
  const candidate = await getCandidate(ctx, args.candidateId)
  let jobTitle = args.targetRoleTitle || candidate.jobTitle || 'General role'
  let jobDescription = ''

  if (args.jobPostingId) {
    const job = trace
      ? await trace.runTool({
          step: 'Load job posting for role comparison',
          toolUsed: 'payload.findByID(job-postings)',
          fn: () =>
            ctx.payload.findByID({
              collection: 'job-postings',
              id: args.jobPostingId!,
              depth: 0,
              overrideAccess: true,
            }),
          resultDetail: (j) => ({ jobId: j.id, title: j.title }),
        })
      : await ctx.payload.findByID({
          collection: 'job-postings',
          id: args.jobPostingId,
          depth: 0,
          overrideAccess: true,
        })
    jobTitle = job.title
    jobDescription = job.description || ''
  }

  const cvSummary =
    args.cvSummary ?? (await buildCvSummary(ctx, args.candidateId, trace))
  const profile = buildCandidateProfileContext(candidate)

  if (!isLlmConfigured()) {
    await trace?.log({
      step: 'LLM not configured',
      toolUsed: 'compareRoleFitWithLlm',
      status: 'skipped',
    })
    return {
      success: false,
      jobTitle,
      error: 'LLM not configured — set OPENAI_API_KEY',
    }
  }

  const llm = trace
    ? await trace.runTool({
        step: `Compare candidate to role: ${jobTitle}`,
        toolUsed: 'compareRoleFitWithLlm',
        fn: () =>
          compareRoleFitWithLlm({
            candidateProfile: profile,
            cvSummary,
            jobTitle,
            jobDescription,
          }),
        resultDetail: (r) => ({
          success: r.success,
          fitScore: r.result?.fitScore,
        }),
      })
    : await compareRoleFitWithLlm({
        candidateProfile: profile,
        cvSummary,
        jobTitle,
        jobDescription,
      })

  if (!llm.success || !llm.result) {
    return { success: false, jobTitle, error: llm.error || 'Role fit failed' }
  }

  return { success: true, result: llm.result, jobTitle }
}

export function getModelUsedLabel(): string {
  return getReadyBotModel()
}
