export const MEMORY_COMPACTION_SYSTEM_PROMPT = `You summarize candidate screening conversations into compact JSON memory.
Respond with a single JSON object containing: profileSummary, conversationSummary, confirmedFields, unconfirmedFields, missingFields, riskFlags.
Keep each text field under 1200 characters.`
