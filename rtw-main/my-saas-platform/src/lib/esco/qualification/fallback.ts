import type { QualificationQuestion, QualificationTemplateResponse } from './schema'
import { PROMPT_VERSION, SCHEMA_VERSION } from './schema'

/**
 * Universal questions shown immediately while AI generates occupation-specific
 * ones. Mirrors the registration wizard's personal / work / location / visa
 * fields (excluding account credentials and protected characteristics).
 *
 * Kept in sync with RegistrationWizard: firstName, lastName, phone, whatsapp,
 * experienceYears, saudiExperience, currentEmployer, availabilityDate,
 * languages, location, visaStatus, visaExpiry, visaProfession — plus
 * mobility / verification extras.
 *
 * Intentionally omitted (same as registration fairness rules for screening):
 * gender, date of birth, nationality. Account credentials (email/password)
 * stay on the real registration Account step.
 */
const FALLBACK_EN: QualificationQuestion[] = [
  {
    id: 'first_name',
    category: 'experience',
    type: 'short_text',
    label: 'What is your first name?',
    required: true,
  },
  {
    id: 'last_name',
    category: 'experience',
    type: 'short_text',
    label: 'What is your last name?',
    required: true,
  },
  {
    id: 'phone',
    category: 'availability',
    type: 'short_text',
    label: 'What is your Saudi phone number? (e.g. +9665…)',
    required: true,
  },
  {
    id: 'whatsapp',
    category: 'availability',
    type: 'short_text',
    label: 'WhatsApp number (optional — leave blank if same as phone)',
    required: false,
  },
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
    id: 'countries_worked',
    category: 'experience',
    type: 'multi_select',
    label: 'In which countries have you done this work?',
    required: true,
    options: ['Saudi Arabia', 'UAE', 'Egypt', 'India', 'Philippines', 'Other'],
  },
  {
    id: 'last_worked',
    category: 'experience',
    type: 'single_select',
    label: 'When did you last work in this occupation?',
    required: true,
    options: ['Currently working', 'Within the last year', '1–3 years ago', 'More than 3 years ago'],
  },
  {
    id: 'current_employer',
    category: 'experience',
    type: 'short_text',
    label: 'Who is your current employer? (optional — leave blank if none)',
    required: false,
  },
  {
    id: 'languages',
    category: 'experience',
    type: 'multi_select',
    label: 'Which languages do you speak?',
    required: true,
    options: ['Arabic', 'English', 'Hindi', 'Urdu', 'Tagalog', 'Malayalam', 'Bengali', 'Other'],
  },
  {
    id: 'current_location',
    category: 'availability',
    type: 'single_select',
    label: 'Which city in Saudi Arabia are you currently in?',
    required: true,
    options: [
      'Riyadh',
      'Jeddah',
      'Dammam',
      'Khobar',
      'Mecca',
      'Medina',
      'Abha',
      'Tabuk',
      'Other',
    ],
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
    id: 'visa_profession',
    category: 'licence',
    type: 'short_text',
    label: 'What job position is written on your visa? (optional)',
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
  {
    id: 'willing_relocate',
    category: 'availability',
    type: 'yes_no',
    label: 'Are you willing to relocate within Saudi Arabia?',
    required: true,
  },
  {
    id: 'willing_shifts',
    category: 'availability',
    type: 'yes_no',
    label: 'Are you willing to work shifts?',
    required: false,
  },
  {
    id: 'proof_available',
    category: 'verification',
    type: 'yes_no',
    label: 'Can you provide proof of this experience (reference, certificate, or contact)?',
    required: false,
  },
]

const FALLBACK_AR: QualificationQuestion[] = [
  {
    id: 'first_name',
    category: 'experience',
    type: 'short_text',
    label: 'ما هو اسمك الأول؟',
    required: true,
  },
  {
    id: 'last_name',
    category: 'experience',
    type: 'short_text',
    label: 'ما هو اسم العائلة؟',
    required: true,
  },
  {
    id: 'phone',
    category: 'availability',
    type: 'short_text',
    label: 'ما هو رقم هاتفك السعودي؟ (مثال: +9665…)',
    required: true,
  },
  {
    id: 'whatsapp',
    category: 'availability',
    type: 'short_text',
    label: 'رقم واتساب (اختياري — اتركه فارغاً إن كان نفس رقم الهاتف)',
    required: false,
  },
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
    id: 'countries_worked',
    category: 'experience',
    type: 'multi_select',
    label: 'في أي دول عملت في هذه المهنة؟',
    required: true,
    options: ['السعودية', 'الإمارات', 'مصر', 'الهند', 'الفلبين', 'أخرى'],
  },
  {
    id: 'last_worked',
    category: 'experience',
    type: 'single_select',
    label: 'متى كانت آخر مرة عملت في هذه المهنة؟',
    required: true,
    options: ['أعمل حالياً', 'خلال السنة الماضية', 'منذ 1–3 سنوات', 'منذ أكثر من 3 سنوات'],
  },
  {
    id: 'current_employer',
    category: 'experience',
    type: 'short_text',
    label: 'من هو صاحب عملك الحالي؟ (اختياري — اتركه فارغاً إن لم يكن لديك)',
    required: false,
  },
  {
    id: 'languages',
    category: 'experience',
    type: 'multi_select',
    label: 'ما هي اللغات التي تتحدثها؟',
    required: true,
    options: ['العربية', 'الإنجليزية', 'الهندية', 'الأردية', 'التاغالوغية', 'المالايالامية', 'البنغالية', 'أخرى'],
  },
  {
    id: 'current_location',
    category: 'availability',
    type: 'single_select',
    label: 'في أي مدينة في السعودية تقيم حالياً؟',
    required: true,
    options: [
      'الرياض',
      'جدة',
      'الدمام',
      'الخبر',
      'مكة',
      'المدينة',
      'أبها',
      'تبوك',
      'أخرى',
    ],
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
    id: 'visa_profession',
    category: 'licence',
    type: 'short_text',
    label: 'ما المسمى الوظيفي المكتوب على تأشيرتك؟ (اختياري)',
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
  {
    id: 'willing_relocate',
    category: 'availability',
    type: 'yes_no',
    label: 'هل أنت مستعد للانتقال داخل السعودية؟',
    required: true,
  },
  {
    id: 'willing_shifts',
    category: 'availability',
    type: 'yes_no',
    label: 'هل أنت مستعد للعمل بنظام الورديات؟',
    required: false,
  },
  {
    id: 'proof_available',
    category: 'verification',
    type: 'yes_no',
    label: 'هل يمكنك تقديم إثبات لهذه الخبرة (مرجع أو شهادة أو جهة اتصال)؟',
    required: false,
  },
]

/** Stable ids covered by the universal set — used to drop AI duplicates. */
export const UNIVERSAL_QUESTION_IDS = new Set(FALLBACK_EN.map((q) => q.id))

/**
 * Topics already asked in the universal / registration set. AI questions whose
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

/**
 * Universal occupation-independent questions (mirrors the registration wizard's
 * experience / location / visa steps). Shown immediately while AI generates
 * occupation-specific questions, and doubles as the fallback set when generation fails.
 */
export function getUniversalQuestions(language: string): QualificationQuestion[] {
  return language === 'ar' ? FALLBACK_AR : FALLBACK_EN
}

/**
 * Universal fallback questions used when AI generation fails.
 * Never persisted as a template — returned with source: 'fallback'.
 */
export function getFallbackTemplate(
  escoUri: string,
  occupationLabel: string,
  language: string,
): QualificationTemplateResponse {
  const questions = language === 'ar' ? FALLBACK_AR : FALLBACK_EN
  return {
    templateId: null,
    escoOccupationUri: escoUri,
    occupationLabel,
    language,
    promptVersion: PROMPT_VERSION,
    schemaVersion: SCHEMA_VERSION,
    source: 'fallback',
    questions,
  }
}

/** True when an AI question duplicates a universal / registration topic. */
export function isUniversalDuplicate(question: QualificationQuestion): boolean {
  if (UNIVERSAL_QUESTION_IDS.has(question.id)) return true
  const label = question.label.trim()
  return UNIVERSAL_TOPIC_PATTERNS.some((re) => re.test(label))
}
