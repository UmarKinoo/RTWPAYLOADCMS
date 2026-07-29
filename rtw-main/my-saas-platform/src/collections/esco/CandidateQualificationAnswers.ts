import type { CollectionConfig } from 'payload'
import { allowOnlyAdmin } from '../../access/allowOnlyAdmin'

/**
 * Candidate answers to a qualification template, linked to a specific
 * candidate-occupation so skills and answers stay occupation-scoped.
 */
export const CandidateQualificationAnswers: CollectionConfig = {
  slug: 'candidate-qualification-answers',
  admin: {
    useAsTitle: 'questionId',
    group: 'ESCO',
    defaultColumns: ['questionId', 'candidateOccupation', 'status', 'createdAt'],
    description: 'Answers submitted by candidates for occupation-specific qualification forms.',
  },
  access: {
    read: allowOnlyAdmin,
    create: () => true,
    update: allowOnlyAdmin,
    delete: allowOnlyAdmin,
  },
  fields: [
    {
      name: 'candidateOccupation',
      type: 'relationship',
      relationTo: 'candidate-occupations',
      required: true,
      index: true,
    },
    {
      name: 'template',
      type: 'relationship',
      relationTo: 'qualification-templates',
      required: false,
      admin: {
        description: 'Null when the candidate answered a fallback (non-persisted) template.',
      },
    },
    {
      name: 'questionId',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'answer',
      type: 'json',
      required: true,
      admin: {
        description: 'Answer value: string, string[], number, boolean, or ISO date string.',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'candidate-declared',
      options: [
        { label: 'Candidate Declared', value: 'candidate-declared' },
        { label: 'Verified', value: 'verified' },
        { label: 'Rejected', value: 'rejected' },
      ],
    },
  ],
}
