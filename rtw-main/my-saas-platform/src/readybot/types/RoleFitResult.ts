export type RoleFitResult = {
  fitScore: number
  fitSummary: string
  gaps: string[]
  recommendedQuestions: string[]
  needsHumanReview: boolean
  reason: string
}
