export {
  PROMPT_VERSION,
  SCHEMA_VERSION,
  QUESTION_CATEGORIES,
  QUESTION_TYPES,
  qualificationQuestionSchema,
  qualificationTemplateSchema,
  normalizeQuestion,
  normalizeTemplate,
} from './schema'
export type {
  QuestionCategory,
  QuestionType,
  QualificationQuestion,
  QualificationTemplatePayload,
  QualificationTemplateResponse,
  ShowWhen,
} from './schema'
export { occupationChecksum } from './checksum'
export { validateTemplate, isQuestionVisible } from './validate'
export { generateQualificationTemplate } from './generator'
export {
  getFallbackTemplate,
  getUniversalQuestions,
  isUniversalDuplicate,
  UNIVERSAL_QUESTION_IDS,
} from './fallback'
