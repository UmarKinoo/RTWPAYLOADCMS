export type ReadyBotDashboardStats = {
  pendingHumanReview: number
  activeTasks: number
  contactedToday: number
  inboundToday: number
  outboundToday: number
  screeningResultsTotal: number
  candidatesInPipeline: number
  byStatus: Record<string, number>
}

export type ReadyBotCandidateRef = {
  id: string
  label: string
  screeningStatus?: string | null
  readyBotEnabled?: boolean | null
}

export type ReadyBotScreeningResultRow = {
  id: string
  candidate: ReadyBotCandidateRef
  targetRoleTitle: string
  fitScore?: number | null
  status: string
  fitSummary?: string | null
  gapCount: number
  questionCount: number
  updatedAt: string
}

export type ReadyBotTaskRow = {
  id: string
  candidate: ReadyBotCandidateRef
  status: string
  channel: string
  attemptCount?: number | null
  missingFieldCount: number
  messagePreview?: string | null
  messageBody?: string | null
  lastSentAt?: string | null
  replyReceivedAt?: string | null
  updatedAt: string
}

export type ReadyBotMessageRow = {
  id: string
  candidate: ReadyBotCandidateRef
  direction: string
  channel: string
  status: string
  bodyPreview: string
  sentAt?: string | null
  receivedAt?: string | null
  createdAt: string
}

export type ReadyBotMemoryRow = {
  id: string
  candidate: ReadyBotCandidateRef
  cvSummaryPreview?: string | null
  conversationSummaryPreview?: string | null
  missingFieldCount: number
  confirmedCount: number
  riskCount: number
  lastAgentDecision?: string | null
  updatedAt: string
}

export type ReadyBotHumanReviewRow = {
  id: string
  candidate: ReadyBotCandidateRef
  status: string
  reason: string
  suggestedUpdate: unknown
  createdAt: string
}

export type ReadyBotAuditRow = {
  id: string
  action: string
  candidateLabel?: string | null
  candidateId?: string | null
  toolUsed?: string | null
  confidence?: number | null
  modelUsed?: string | null
  reasonPreview?: string | null
  createdAt: string
  phase?: string
  step?: string
  status?: string
  workflowRunId?: string
  workflowName?: string
  stepIndex?: number
  detail?: Record<string, unknown>
}

export type ReadyBotLiveLogRow = Omit<
  ReadyBotAuditRow,
  'phase' | 'step' | 'status' | 'workflowRunId' | 'workflowName' | 'stepIndex'
> & {
  phase: string
  step: string
  status: string
  workflowRunId: string | null
  workflowName: string | null
  stepIndex: number | null
}

export type ReadyBotDashboardData = {
  stats: ReadyBotDashboardStats
  screeningResults: ReadyBotScreeningResultRow[]
  tasks: ReadyBotTaskRow[]
  messages: ReadyBotMessageRow[]
  memories: ReadyBotMemoryRow[]
  humanReviews: ReadyBotHumanReviewRow[]
  auditLogs: ReadyBotAuditRow[]
  pipelineCandidates: ReadyBotCandidateRef[]
}

export type ReadyBotCandidateDetailData = {
  candidate: {
    id: string
    label: string
    email?: string | null
    phone?: string | null
    jobTitle?: string | null
    readyBot: {
      readyBotEnabled?: boolean | null
      screeningStatus?: string | null
      missingFields?: { field: string }[]
      whatsappNumber?: string | null
      whatsappOptIn?: boolean | null
      lastScreenedAt?: string | null
      lastContactedAt?: string | null
      lastReplyAt?: string | null
      screeningSummary?: string | null
      screeningConfidence?: number | null
    }
  }
  memory: ReadyBotMemoryRow | null
  screeningResults: ReadyBotScreeningResultRow[]
  tasks: ReadyBotTaskRow[]
  messages: ReadyBotMessageRow[]
  humanReviews: ReadyBotHumanReviewRow[]
  auditLogs: ReadyBotAuditRow[]
}
