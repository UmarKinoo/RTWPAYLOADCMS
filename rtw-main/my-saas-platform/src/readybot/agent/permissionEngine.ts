import { agentEventService } from './agentEventService'
import type {
  PermissionMode,
  PermissionDecision,
  AgentContext,
  ToolDeclaration,
} from './types'

const EXTERNAL_TOOLS = new Set([
  'send_whatsapp_message',
  'notify_recruiter',
  'schedule_bland_call',
  'change_candidate_status',
])

export class PermissionEngine {
  async checkPermission(
    tool: ToolDeclaration,
    context: AgentContext,
  ): Promise<PermissionDecision> {
    const decision = this.evaluate(tool, context)
    await agentEventService.recordEvent(
      'permission_decision',
      {
        ...decision,
        riskLevel: tool.riskLevel,
        description: tool.description,
      },
      {
        candidateId: context.candidateId,
        jobId: context.jobId,
        conversationId: context.conversationId,
        sessionId: context.sessionId,
      },
    )
    return decision
  }

  private evaluate(tool: ToolDeclaration, context: AgentContext): PermissionDecision {
    const { permissionMode, allowedTools } = context
    const base = { toolName: tool.name, mode: permissionMode }

    if (permissionMode === 'danger-full-access') {
      return {
        ...base,
        granted: true,
        requiresApproval: false,
        reason: 'danger-full-access grants all tools',
      }
    }

    if (permissionMode === 'allowed-tools-only') {
      const allowed = allowedTools?.includes(tool.name) ?? false
      return {
        ...base,
        granted: allowed,
        requiresApproval: false,
        reason: allowed
          ? 'Tool is in session whitelist'
          : 'Tool not in session whitelist for allowed-tools-only mode',
      }
    }

    if (permissionMode === 'read-only') {
      const granted = tool.riskLevel === 'low'
      return {
        ...base,
        granted,
        requiresApproval: false,
        reason: granted
          ? 'Low-risk read tool allowed in read-only mode'
          : `read-only mode blocks ${tool.riskLevel}-risk tool: ${tool.name}`,
      }
    }

    if (permissionMode === 'ask-before-edit') {
      const granted = tool.riskLevel === 'low' || tool.riskLevel === 'medium'
      const requiresApproval =
        granted && (tool.riskLevel !== 'low' || tool.requiresHumanApproval)
      return {
        ...base,
        granted,
        requiresApproval,
        reason: granted
          ? requiresApproval
            ? 'Granted — pending human approval before execution'
            : 'Low-risk tool auto-approved in ask-before-edit mode'
          : 'High/critical risk tool not allowed in ask-before-edit mode',
      }
    }

    if (permissionMode === 'workspace-write') {
      const isExternal = EXTERNAL_TOOLS.has(tool.name)
      return {
        ...base,
        granted: !isExternal,
        requiresApproval: isExternal || tool.requiresHumanApproval,
        reason: isExternal
          ? 'External actions require ask-before-edit or explicit approval'
          : 'Internal workspace write granted',
      }
    }

    return {
      ...base,
      granted: false,
      requiresApproval: false,
      reason: `Unknown permission mode: ${permissionMode as string}`,
    }
  }

  /** Returns true if the tool can execute immediately (no approval gate). */
  canExecuteImmediately(decision: PermissionDecision): boolean {
    return decision.granted && !decision.requiresApproval
  }
}

export const permissionEngine = new PermissionEngine()
