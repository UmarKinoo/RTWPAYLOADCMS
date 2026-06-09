// ReadyBot Agent OS — shared types

export type EventType =
  | 'user_message'
  | 'assistant_message'
  | 'candidate_message'
  | 'bot_message'
  | 'tool_call'
  | 'tool_result'
  | 'profile_update'
  | 'score_update'
  | 'status_change'
  | 'permission_decision'
  | 'compaction_event'
  | 'error'
  | 'resume_marker'
  | 'human_override'

export type PermissionMode =
  | 'read-only'
  | 'ask-before-edit'
  | 'workspace-write'
  | 'allowed-tools-only'
  | 'danger-full-access'

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export interface AgentEventMetadata {
  candidateId?: string | number
  jobId?: string | number
  conversationId?: string
  sessionId?: string
}

export interface AgentContext {
  candidateId?: string | number
  jobId?: string | number
  conversationId?: string
  sessionId?: string
  permissionMode: PermissionMode
  allowedTools?: string[]
}

export interface ToolDeclaration<TInput = unknown> {
  name: string
  description: string
  riskLevel: RiskLevel
  requiredPermissionMode: PermissionMode
  requiresHumanApproval: boolean
  handler: (input: TInput, context: AgentContext) => Promise<unknown>
}

export interface PermissionDecision {
  granted: boolean
  mode: PermissionMode
  toolName: string
  reason: string
  requiresApproval: boolean
}

export interface CompactedMemory {
  candidate_summary: string
  job_summary: string
  conversation_summary: string
  important_facts: string[]
  open_questions: string[]
  contradictions: string[]
  current_stage: string
  next_recommended_action: string
}

export interface ContextBundle {
  systemInstructions: string
  candidateProfile: Record<string, unknown> | null
  jobProfile: Record<string, unknown> | null
  recentMessages: Array<{ role: string; content: string; timestamp?: string }>
  conversationSummary: string
  currentTaskState: string
  missingInformation: string[]
  previousDecisions: string[]
  allowedTools: string[]
  permissionMode: PermissionMode
  compactedMemory: CompactedMemory | null
}

export interface ToolCallResult {
  success: boolean
  data?: unknown
  error?: string
  requiresApproval?: boolean
  approvalRequest?: {
    toolName: string
    input: unknown
    reason: string
  }
}
