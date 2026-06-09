import type { ReadyBotPayloadContext } from '../tools/payloadTool'
import type { WorkflowTrace } from '../tools/workflowTrace'

export async function createHumanReviewTask(
  ctx: ReadyBotPayloadContext,
  args: {
    candidateId: string | number
    screeningTaskId?: string | number
    reason: string
    suggestedUpdate: Record<string, unknown>
    trace?: WorkflowTrace
  },
) {
  const trace = args.trace
  const task = trace
    ? await trace.runTool({
        phase: 'review',
        step: 'Create human review task',
        toolUsed: 'payload.create(human-review-tasks)',
        fn: () =>
          ctx.payload.create({
            collection: 'human-review-tasks',
            data: {
              candidate: args.candidateId,
              screeningTask: args.screeningTaskId,
              reason: args.reason,
              suggestedUpdate: args.suggestedUpdate,
              status: 'pending',
            } as never,
            overrideAccess: true,
          }),
        detail: { reason: args.reason },
        resultDetail: (t) => ({ reviewTaskId: t.id }),
      })
    : await ctx.payload.create({
        collection: 'human-review-tasks',
        data: {
          candidate: args.candidateId,
          screeningTask: args.screeningTaskId,
          reason: args.reason,
          suggestedUpdate: args.suggestedUpdate,
          status: 'pending',
        } as never,
        overrideAccess: true,
      })

  await trace?.log({
    phase: 'review',
    step: 'Queued for human review',
    toolUsed: 'createHumanReviewTask',
    status: 'success',
    detail: { reason: args.reason, reviewTaskId: task.id },
  })

  return task
}
