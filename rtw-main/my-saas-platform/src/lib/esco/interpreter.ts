/**
 * AI search interpreter — server-only.
 *
 * Translates informal, misspelled, or non-English candidate wording into
 * 3-5 precise ESCO-compatible English occupation search terms.
 *
 * The AI NEVER chooses a final occupation; it only generates search terms.
 */

import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

const interpretedSchema = z.object({
  originalInput: z.string(),
  detectedLanguage: z.string(),
  searchTerms: z
    .array(z.string())
    .min(1)
    .max(8)
    .describe('ESCO-compatible English occupation search terms, 1-5 words each'),
})

export type InterpretedQuery = z.infer<typeof interpretedSchema>

const SYSTEM_PROMPT = `You are an ESCO occupation search term generator for a blue-collar job matching platform.

Your ONLY job is to understand what kind of work the candidate has done and return ESCO-compatible English occupation search terms.

Rules:
- Detect the language of the input (ISO 639-1 code).
- Understand informal, abbreviated, misspelled, or translated job names.
- Fix spelling mistakes.
- Translate non-English input into English occupation terms.
- Return 3 to 5 precise ESCO-compatible occupation search terms.
- If the input describes multiple distinct types of work (e.g. cleaning + cooking + driving), generate terms for EACH type separately.
- Use standard ESCO vocabulary (e.g. "air conditioning technician" not "AC fixer").
- NEVER invent qualifications or experience the candidate did not mention.
- NEVER choose a final occupation — only produce search terms.
- Return ONLY the JSON object, no other text.

Examples:
Input: "AC worker" → searchTerms: ["air conditioning technician", "HVAC technician", "refrigeration technician"]
Input: "I load boxes and scan products" → searchTerms: ["warehouse worker", "order picker", "freight handler", "stock handler"]
Input: "Housemaid who also cooks and drives the family" → searchTerms: ["domestic housekeeper", "domestic cleaner", "private chef", "chauffeur", "home cook"]
Input: "كهربائي منازل" → searchTerms: ["domestic electrician", "residential electrician", "electrical installer"]
Input: "Chauffeur famille" → searchTerms: ["private driver", "chauffeur", "family driver"]`

export async function interpretQuery(input: string): Promise<InterpretedQuery> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set')
  }

  const { object } = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: interpretedSchema,
    system: SYSTEM_PROMPT,
    prompt: input.trim(),
  })

  return object
}
