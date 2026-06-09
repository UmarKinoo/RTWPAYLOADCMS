/** Max rows returned by listCandidates in ops chat (token control). */
export const CHAT_LIST_MAX_ROWS = 10

/** Above this total, chat should redirect to Payload / ReadyBot UI instead of paging in chat. */
export const CHAT_LIST_REDIRECT_THRESHOLD = 50

export const PAYLOAD_CANDIDATES_ADMIN_PATH = '/admin/collections/candidates'

/** User explicitly asked to run a candidate scan batch. */
export function isExplicitRunScanRequest(message: string): boolean {
  return /\b(run scan|start scan|trigger scan|scan candidates|scan now|pnpm readybot:scan)\b/i.test(
    message,
  )
}

/**
 * Message lacks enough detail to safely run action tools (scan, profile writes, etc.).
 * In this case the assistant should ask clarifying questions — no tools.
 */
export function isVagueUserMessage(message: string): boolean {
  const t = message.trim()
  if (!t) return true
  const lower = t.toLowerCase()

  if (isExplicitRunScanRequest(t)) return false
  if (
    /\b(find|search|list|show|tell me|how many|pending review|human review|pipeline stats)\b/i.test(
      lower,
    )
  ) {
    return false
  }
  if (/\b(candidate\s*id|id\s*#?\s*\d+|#\d{2,})\b/i.test(lower)) return false
  if (/@[\w.-]+\.\w+/.test(lower) || /\breadybot\./i.test(lower)) return false

  const hasOpsNoun = /\b(candidate|scan|review|profile|pipeline|task|screening)\b/i.test(lower)

  if (
    /\b(fix|broken|help me|the one|something wrong|not working|what should i do)\b/i.test(lower) &&
    !hasOpsNoun &&
    !/\d{2,}/.test(lower)
  ) {
    return true
  }

  const wordCount = t.split(/\s+/).length
  if (wordCount <= 5 && !hasOpsNoun && /\b(fix|broken|help|stuck|issue|problem)\b/i.test(lower)) {
    return true
  }

  return false
}

export const CLARIFICATION_MODE_PROMPT = `[Clarification mode]
The user's last message is too vague to run tools safely.
Do NOT call any tools (especially runScan or updateCandidateProfile).
Reply with 1–2 short clarifying questions, e.g. which candidate (name or ID), whether they want a scan, a profile fix, or a pipeline status check.
Wait for their answer before using tools.`

/** User said "list candidates" (or similar) without a scope — too broad for chat. */
export function isUnscopedListCandidatesRequest(message: string): boolean {
  const lower = message.trim().toLowerCase()
  if (!/\b(list|show all|all candidates|every candidate|give me candidates)\b/.test(lower)) {
    return false
  }
  if (/\b(find|search|look up)\b/.test(lower)) return false
  return !hasExplicitListScope(message)
}

/** User narrowed the list (count, status filter, pipeline-only, etc.). */
export function hasExplicitListScope(message: string): boolean {
  const lower = message.trim().toLowerCase()
  return (
    /\b(first|top|limit|page)\s*\d+\b/.test(lower) ||
    /\b\d+\s*candidates?\b/.test(lower) ||
    /\b(incomplete|verified|contacted|info_received|needs.?human|new)\b/.test(lower) ||
    /\b(screening status|pending review|human review|missing fields)\b/.test(lower) ||
    /\b(pipeline|readybot)\s*(only|candidates|queue)\b/.test(lower) ||
    /\bwith\b.+\b(status|skill|title|location)\b/.test(lower)
  )
}

export function listCandidatesClarificationPrompt(locale: string): string {
  return `[List candidates — clarification required]
The user asked to list candidates without saying which slice they need.
Do NOT call listCandidates yet.
Ask which subset they want, for example:
- ReadyBot pipeline only vs all site candidates
- Screening status (incomplete, verified, needs human review)
- How many rows (max ${CHAT_LIST_MAX_ROWS} in chat)
- Or a name/email search (use findCandidate instead)

If they need a large browse (${CHAT_LIST_REDIRECT_THRESHOLD}+ rows), direct them to:
- Payload Admin: ${PAYLOAD_CANDIDATES_ADMIN_PATH} (filters, export, bulk edit)
- ReadyBot dashboard: /${locale}/readybot (pipeline tabs and candidate detail)
Explain chat is for small targeted lists and counts (getPipelineStats), not dumping thousands of profiles.`
}
