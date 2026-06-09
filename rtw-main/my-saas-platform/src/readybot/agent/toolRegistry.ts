import { z } from 'zod'
import { permissionEngine } from './permissionEngine'
import { agentEventService } from './agentEventService'
import type { ToolDeclaration, AgentContext, ToolCallResult } from './types'

type RegisteredTool<TInput = unknown> = ToolDeclaration<TInput> & {
  inputSchema: z.ZodType<TInput>
}

export class ToolRegistry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private tools = new Map<string, RegisteredTool<any>>()

  register<TInput>(
    declaration: ToolDeclaration<TInput>,
    inputSchema: z.ZodType<TInput>,
  ): void {
    if (this.tools.has(declaration.name)) {
      console.warn(`[ToolRegistry] Overwriting existing tool: ${declaration.name}`)
    }
    this.tools.set(declaration.name, { ...declaration, inputSchema })
  }

  getTool(name: string): RegisteredTool | undefined {
    return this.tools.get(name)
  }

  listTools() {
    return Array.from(this.tools.values()).map(
      ({ name, description, riskLevel, requiredPermissionMode, requiresHumanApproval }) => ({
        name,
        description,
        riskLevel,
        requiredPermissionMode,
        requiresHumanApproval,
      }),
    )
  }

  async executeTool(
    name: string,
    rawInput: unknown,
    context: AgentContext,
  ): Promise<ToolCallResult> {
    const tool = this.tools.get(name)
    if (!tool) {
      return { success: false, error: `Tool not found: ${name}` }
    }

    // Permission check (also records permission_decision event)
    const decision = await permissionEngine.checkPermission(tool, context)
    if (!decision.granted) {
      return { success: false, error: decision.reason }
    }

    // Requires human approval — surface the approval request
    if (decision.requiresApproval) {
      return {
        success: false,
        requiresApproval: true,
        approvalRequest: {
          toolName: name,
          input: rawInput,
          reason: decision.reason,
        },
      }
    }

    // Validate input schema
    const parsed = tool.inputSchema.safeParse(rawInput)
    if (!parsed.success) {
      return {
        success: false,
        error: `Invalid input for ${name}: ${parsed.error.message}`,
      }
    }

    // Audit: record tool_call event
    await agentEventService.recordEvent(
      'tool_call',
      { toolName: name, input: parsed.data },
      {
        candidateId: context.candidateId,
        jobId: context.jobId,
        conversationId: context.conversationId,
        sessionId: context.sessionId,
      },
    )

    // Execute handler
    try {
      const data = await tool.handler(parsed.data, context)

      await agentEventService.recordEvent(
        'tool_result',
        { toolName: name, output: data },
        {
          candidateId: context.candidateId,
          jobId: context.jobId,
          conversationId: context.conversationId,
          sessionId: context.sessionId,
        },
      )

      return { success: true, data }
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err)

      await agentEventService.recordEvent(
        'error',
        { toolName: name, error },
        {
          candidateId: context.candidateId,
          jobId: context.jobId,
          conversationId: context.conversationId,
          sessionId: context.sessionId,
        },
      )

      return { success: false, error }
    }
  }
}

export const toolRegistry = new ToolRegistry()
