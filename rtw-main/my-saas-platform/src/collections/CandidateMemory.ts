import type { CollectionConfig } from 'payload'
import { hiddenFromBlogEditor } from '../access/hiddenFromBlogEditor'
import { allowOnlyAdmin } from '../access/allowOnlyAdmin'

export const CandidateMemory: CollectionConfig = {
  slug: 'candidate-memory',
  labels: {
    singular: 'Candidate Memory',
    plural: 'Candidate Memory',
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
    useAsTitle: 'candidate',
    defaultColumns: ['candidate', 'updatedAt'],
  },
  fields: [
    {
      name: 'candidate',
      type: 'relationship',
      relationTo: 'candidates',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'profileSummary',
      type: 'textarea',
    },
    {
      name: 'cvSummary',
      type: 'textarea',
    },
    {
      name: 'conversationSummary',
      type: 'textarea',
    },
    {
      name: 'confirmedFields',
      type: 'array',
      fields: [{ name: 'field', type: 'text', required: true }],
    },
    {
      name: 'unconfirmedFields',
      type: 'array',
      fields: [{ name: 'field', type: 'text', required: true }],
    },
    {
      name: 'missingFields',
      type: 'array',
      fields: [{ name: 'field', type: 'text', required: true }],
    },
    {
      name: 'importantCorrections',
      type: 'array',
      fields: [
        { name: 'field', type: 'text', required: true },
        { name: 'previousValue', type: 'text' },
        { name: 'newValue', type: 'text' },
        { name: 'reason', type: 'textarea' },
      ],
    },
    {
      name: 'lastQuestionAsked',
      type: 'textarea',
    },
    {
      name: 'lastAgentDecision',
      type: 'textarea',
    },
    {
      name: 'riskFlags',
      type: 'array',
      fields: [{ name: 'flag', type: 'text', required: true }],
    },
    {
      name: 'whatsappSession',
      type: 'json',
      admin: {
        description: 'AI SDK message history for the WhatsApp conversation (role/content pairs)',
      },
    },
  ],
}
