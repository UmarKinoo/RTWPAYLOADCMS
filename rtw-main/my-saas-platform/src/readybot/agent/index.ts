// ReadyBot Agent OS — public API barrel
// Import this module to get all Agent OS services AND register all tools.

export type {
  EventType,
  PermissionMode,
  RiskLevel,
  AgentEventMetadata,
  AgentContext,
  ToolDeclaration,
  PermissionDecision,
  CompactedMemory,
  ContextBundle,
  ToolCallResult,
} from './types'

export { agentEventService, AgentEventService } from './agentEventService'
export { permissionEngine, PermissionEngine } from './permissionEngine'
export { toolRegistry, ToolRegistry } from './toolRegistry'
export { contextManager, ContextManager } from './contextManager'
export { compactionPipeline, CompactionPipeline } from './compactionPipeline'

// Side-effect imports: registers all built-in tools into the global toolRegistry
import './tools/readTools'
import './tools/writeTools'
import './tools/externalTools'
