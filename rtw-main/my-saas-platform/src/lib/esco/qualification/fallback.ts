import type { QualificationQuestion, QualificationTemplateResponse } from './schema'
import { PROMPT_VERSION, SCHEMA_VERSION } from './schema'

/**
 * Lean universal questions shown while AI generates occupation-specific ones.
 *
 * Only high-value fields needed for the candidates profile that are not
 * collected in Account / Personal steps: experience, visa, availability.
 *
 * Identity (name, phone, languages, city) and account credentials live on
 * earlier registration steps. Extra mobility/proof questions are skipped here
 * to keep the mobile flow short — ReadyBot can chase gaps later.
 */
const FALLBACK_EN: QualificationQuestion[] = [
  {
    id: 'experience_years',
    category: 'experience',
    type: 'single_select',
    label: 'How many years of total work experience do you have?',
    required: true,
    options: ['Less than 1 year', '1–2 years', '3–5 years', 'More than 5 years'],
  },
  {
    id: 'saudi_experience',
    category: 'experience',
    type: 'single_select',
    label: 'How many years have you worked in Saudi Arabia?',
    required: true,
    options: ['None yet', 'Less than 1 year', '1–2 years', '3–5 years', 'More than 5 years'],
  },
  {
    id: 'visa_status',
    category: 'licence',
    type: 'single_select',
    label: 'What is your Saudi visa status?',
    required: true,
    options: ['Active', 'Nearly expired', 'Expired', 'No visa'],
  },
  {
    id: 'visa_expiry',
    category: 'licence',
    type: 'date',
    label: 'When does your visa expire?',
    required: false,
    showWhen: {
      questionId: 'visa_status',
      operator: 'not_equals',
      value: 'No visa',
    },
  },
  {
    id: 'availability_date',
    category: 'availability',
    type: 'date',
    label: 'When are you available to join a new job?',
    required: true,
  },
]

const FALLBACK_AR: QualificationQuestion[] = [
  {
    id: 'experience_years',
    category: 'experience',
    type: 'single_select',
    label: 'كم سنة من الخبرة العملية الإجمالية لديك؟',
    required: true,
    options: ['أقل من سنة', '1–2 سنوات', '3–5 سنوات', 'أكثر من 5 سنوات'],
  },
  {
    id: 'saudi_experience',
    category: 'experience',
    type: 'single_select',
    label: 'كم سنة عملت في المملكة العربية السعودية؟',
    required: true,
    options: ['لا يوجد بعد', 'أقل من سنة', '1–2 سنوات', '3–5 سنوات', 'أكثر من 5 سنوات'],
  },
  {
    id: 'visa_status',
    category: 'licence',
    type: 'single_select',
    label: 'ما هو وضع تأشيرتك في السعودية؟',
    required: true,
    options: ['سارية', 'قاربت على الانتهاء', 'منتهية', 'لا توجد تأشيرة'],
  },
  {
    id: 'visa_expiry',
    category: 'licence',
    type: 'date',
    label: 'متى تنتهي صلاحية تأشيرتك؟',
    required: false,
    showWhen: {
      questionId: 'visa_status',
      operator: 'not_equals',
      value: 'لا توجد تأشيرة',
    },
  },
  {
    id: 'availability_date',
    category: 'availability',
    type: 'date',
    label: 'متى يمكنك الانضمام لعمل جديد؟',
    required: true,
  },
]

/** Stable ids covered by the universal set — used to drop AI duplicates. */
export const UNIVERSAL_QUESTION_IDS = new Set(FALLBACK_EN.map((q) => q.id))

/**
 * Topics already asked in universal / registration steps. AI questions whose
 * labels match these are dropped even if their id/category differs.
 */
export const UNIVERSAL_TOPIC_PATTERNS: RegExp[] = [
  /first\s+name|what\s+is\s+your\s+name/i,
  /last\s+name|family\s+name|surname/i,
  /phone\s+number|mobile\s+number|whatsapp/i,
  /اسمك|اسم العائلة|رقم هاتف|واتساب/,
  /years?\s+(of\s+)?(total\s+)?(work\s+)?experience/i,
  /how many years.*(work|occupat|experienc)/i,
  /saudi\s+arabia.*(year|experience|work)/i,
  /years?.*(saudi|ksa)/i,
  /countries?\s+(have\s+you\s+)?(done|worked|work)/i,
  /last\s+(time\s+)?(you\s+)?work/i,
  /currently\s+working/i,
  /current\s+employer/i,
  /languages?\s+(do\s+you\s+)?speak/i,
  /which\s+languages?/i,
  /which\s+city|current\s+location|where\s+(do\s+you\s+)?(live|stay|based)/i,
  /\bvisa\s+(status|expir|position|profession)\b/i,
  /job\s+position\s+(in|on)\s+(your\s+)?visa/i,
  /when\s+(can|are)\s+you\s+(start|available|join)/i,
  /available\s+to\s+(join|start)/i,
  /date\s+available/i,
  /willing\s+to\s+relocate|relocat/i,
  /willing\s+to\s+work\s+shifts|work\s+shifts/i,
  /proof\s+of\s+(this\s+)?experience|provide\s+proof|previous\s+employer/i,
  /كم سنة/,
  /خبرة/,
  /اللغات/,
  /تأشير/,
  /الانتقال/,
  /الورديات/,
]

export function getUniversalQuestions(language: string): QualificationQuestion[] {
  return language === 'ar' ? FALLBACK_AR : FALLBACK_EN
}

export function getFallbackTemplate(
  escoUri: string,
  occupationLabel: string,
  language: string,
): QualificationTemplateResponse {
  return {
    templateId: null,
    escoOccupationUri: escoUri,
    occupationLabel,
    language,
    promptVersion: PROMPT_VERSION,
    schemaVersion: SCHEMA_VERSION,
    source: 'fallback',
    questions: getUniversalQuestions(language),
  }
}

export function isUniversalDuplicate(question: QualificationQuestion): boolean {
  if (UNIVERSAL_QUESTION_IDS.has(question.id)) return true
  const label = question.label.trim()
  return UNIVERSAL_TOPIC_PATTERNS.some((re) => re.test(label))
}
