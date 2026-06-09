import type { CollectionConfig } from 'payload'
import { hiddenFromBlogEditor } from '../access/hiddenFromBlogEditor'
import { allowOnlyAdmin } from '../access/allowOnlyAdmin'

export const ScreeningResults: CollectionConfig = {
  slug: 'screening-results',
  labels: {
    singular: 'Screening Result',
    plural: 'Screening Results',
  },
  access: {
    create: allowOnlyAdmin,
    read: allowOnlyAdmin,
    update: allowOnlyAdmin,
    delete: allowOnlyAdmin,
  },
  admin: {
    group: 'ReadyBot',
    hidden: hiddenFromBlogEditor,
    useAsTitle: 'id',
    defaultColumns: ['candidate', 'targetRoleTitle', 'fitScore', 'status', 'updatedAt'],
  },
  fields: [
    {
      name: 'candidate',
      type: 'relationship',
      relationTo: 'candidates',
      required: true,
      index: true,
    },
    {
      name: 'jobPosting',
      type: 'relationship',
      relationTo: 'job-postings',
      admin: { description: 'Optional job posting used for role comparison' },
    },
    {
      name: 'screeningTask',
      type: 'relationship',
      relationTo: 'candidate-screening-tasks',
    },
    {
      name: 'targetRoleTitle',
      type: 'text',
      required: true,
    },
    {
      name: 'fitScore',
      type: 'number',
      min: 0,
      max: 100,
      admin: { description: '0–100 role fit score' },
    },
    {
      name: 'fitSummary',
      type: 'textarea',
    },
    {
      name: 'gaps',
      type: 'array',
      fields: [{ name: 'gap', type: 'text', required: true }],
    },
    {
      name: 'recommendedQuestions',
      type: 'array',
      fields: [{ name: 'question', type: 'textarea', required: true }],
    },
    {
      name: 'cvSummary',
      type: 'textarea',
    },
    {
      name: 'profileUnderstanding',
      type: 'json',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Ready to Contact', value: 'ready_to_contact' },
        { label: 'Contacted', value: 'contacted' },
        { label: 'Completed', value: 'completed' },
        { label: 'Needs Human Review', value: 'needs_human_review' },
      ],
    },
    {
      name: 'modelUsed',
      type: 'text',
    },
  ],
  timestamps: true,
}
