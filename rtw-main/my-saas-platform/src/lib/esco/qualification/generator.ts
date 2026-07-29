/**
 * AI qualification-question generator — server-only.
 *
 * Generates 3–5 occupation-specific qualification questions from ESCO
 * occupation data. Output is validated strictly; regenerates on failure.
 */

import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import type { EscoOccupationDetail } from '../occupation'
import {
  qualificationTemplateSchema,
  PROMPT_VERSION,
  normalizeTemplate,
  coerceNullableFields,
  type QualificationTemplatePayload,
} from './schema'
import { validateTemplate } from './validate'

const SYSTEM_PROMPT = `You are a qualification-question generator for ReadyToWork, a blue-collar job matching platform in Saudi Arabia.

Given an ESCO occupation (title, description, skills), generate a short qualification form (3–5 questions) that helps assess how qualified a candidate is for that specific occupation.

RULES:
1. Questions must be short, simple, mobile-friendly, suitable for candidates with limited digital literacy.
2. Prefer selectable responses (single_select, multi_select, yes_no, number_range) over free text. Use short_text only when necessary. Never ask for long free-text answers.
3. Do NOT ask candidates to label themselves as beginner, intermediate, expert, or professional.
4. Focus ONLY on occupation-specific categories: tasks, equipment, licence (occupation licences/certificates only), environment. Do NOT generate generic experience, availability, verification, language, location, visa-status, employer, or "years of experience" questions — those are collected separately.
5. For tasks: use ESCO essential/optional skills to identify practical duties. Ask which tasks they have performed and how frequently (Occasionally / Regularly / Daily / I trained or supervised others).
6. For equipment: generate occupation-specific options (e.g. vehicle types for drivers, welding methods for welders, property types for housekeepers).
7. For licences: ONLY ask when the occupation reasonably requires or benefits from them (e.g. forklift, welding certificate, heavy-vehicle licence, food safety). Use conditional showWhen for follow-ups (category, expiry) that depend on a yes answer. Do NOT ask for document uploads. Do NOT ask about Saudi work visa status, visa expiry, or visa profession.
8. For work environment: ask about meaningful contexts (private home, hotel, construction site, etc.) — not broad "industry" questions.
9. Do NOT ask: first/last name, phone, WhatsApp, years of experience, Saudi experience years, countries worked, last time worked, currently working, current employer, languages spoken, current city/location, visa status/expiry/profession, availability/start date, willingness to relocate, willingness to work shifts, or proof of experience — those are already covered by the registration/universal set.
10. Use conditional showWhen: { questionId, operator: "equals"|"includes"|"not_equals", value } so follow-up questions only appear when relevant.
11. Question ids must be stable snake_case (e.g. vehicle_types, welding_methods). Labels must be specific to THIS occupation — never vague.
12. Write all labels and options in the requested language. Keep technical standards, licence categories (C, CE, TIG, MIG), and official document names untranslated.
13. NEVER ask about: religion, race, ethnicity, politics, pregnancy, marital status, sexual orientation, disability/health (unless lawful process), appearance, accent, nationality, age, gender, or any protected characteristic.
14. Do not invent nationality, age, or gender requirements from ESCO data.
15. Always include options, showWhen, and sourceSkillUris on every question. Use null when they do not apply (e.g. options: null for yes_no/date/short_text; showWhen: null when unconditional; sourceSkillUris: null when none).
16. Return ONLY the JSON object matching the schema.`

export interface GenerateOptions {
  occupation: EscoOccupationDetail
  language: string
  previousErrors?: string[]
}

function buildUserPrompt(opts: GenerateOptions): string {
  const { occupation, language, previousErrors } = opts
  const essential = occupation.essentialSkills
    .slice(0, 25)
    .map((s) => `- ${s.label} (${s.uri})`)
    .join('\n')
  const optional = occupation.optionalSkills
    .slice(0, 15)
    .map((s) => `- ${s.label}`)
    .join('\n')

  let prompt = `Generate a qualification form for this occupation.

ESCO URI: ${occupation.uri}
Preferred title: ${occupation.preferredLabel}
Alternative titles: ${occupation.altLabels.slice(0, 8).join(', ') || 'none'}
Description: ${occupation.description.slice(0, 800)}

Essential skills:
${essential || '(none listed)'}

Optional skills:
${optional || '(none listed)'}

Language for labels and options: ${language}
promptVersion: ${PROMPT_VERSION}

Set escoOccupationUri to the ESCO URI above, occupationLabel to the preferred title, language to "${language}", promptVersion to "${PROMPT_VERSION}".
Generate exactly 3–5 occupation-specific questions only (the most important tasks, equipment, licences/certificates, or work environment for this job). Prefer 3 when the occupation is simple. Do not include generic experience, availability, languages, location, or visa questions.`

  if (previousErrors?.length) {
    prompt += `\n\nYour previous output was rejected for these reasons. Fix ALL of them:\n${previousErrors.map((e) => `- ${e}`).join('\n')}`
  }

  return prompt
}

async function callGenerator(opts: GenerateOptions): Promise<QualificationTemplatePayload> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set')
  }

  const { object } = await generateObject({
    model: openai('gpt-4o'),
    schema: qualificationTemplateSchema,
    system: SYSTEM_PROMPT,
    prompt: buildUserPrompt(opts),
  })

  // Force the URI / version we trust, not whatever the model invents
  return normalizeTemplate(
    coerceNullableFields({
      ...object,
      escoOccupationUri: opts.occupation.uri,
      occupationLabel: opts.occupation.preferredLabel,
      language: opts.language,
      promptVersion: PROMPT_VERSION,
    }) as Parameters<typeof normalizeTemplate>[0],
  )
}

/**
 * Generate and validate a qualification template.
 * Retries up to 2 times with validation errors fed back to the model.
 */
export async function generateQualificationTemplate(
  occupation: EscoOccupationDetail,
  language: string,
): Promise<QualificationTemplatePayload> {
  let previousErrors: string[] | undefined

  for (let attempt = 0; attempt < 3; attempt++) {
    const raw = await callGenerator({ occupation, language, previousErrors })
    const result = validateTemplate(raw)
    if (result.ok && result.data) {
      return result.data
    }
    previousErrors = result.errors
    console.warn(
      `[qualification] validation failed (attempt ${attempt + 1}):`,
      result.errors.join('; '),
    )
  }

  throw new Error(
    `Qualification generation failed validation after 3 attempts: ${previousErrors?.join('; ')}`,
  )
}
