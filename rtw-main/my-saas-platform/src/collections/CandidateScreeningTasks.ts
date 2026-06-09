import type { CollectionConfig } from 'payload'
import { hiddenFromBlogEditor } from '../access/hiddenFromBlogEditor'
import { allowOnlyAdmin } from '../access/allowOnlyAdmin'

export const CandidateScreeningTasks: CollectionConfig = {
  slug: 'candidate-screening-tasks',
  labels: {
    singular: 'Screening Task',
    plural: 'Screening Tasks',
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
    defaultColumns: ['candidate', 'status', 'channel', 'attemptCount', 'lastSentAt', 'updatedAt'],
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
    },
    {
      name: 'screeningResult',
      type: 'relationship',
      relationTo: 'screening-results',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Message Sent', value: 'message_sent' },
        { label: 'Awaiting Reply', value: 'awaiting_reply' },
        { label: 'Reply Received', value: 'reply_received' },
        { label: 'Processed', value: 'processed' },
        { label: 'Needs Human Review', value: 'needs_human_review' },
        { label: 'Completed', value: 'completed' },
        { label: 'Failed', value: 'failed' },
        { label: 'Unresponsive', value: 'unresponsive' },
      ],
    },
    {
      name: 'channel',
      type: 'select',
      required: true,
      defaultValue: 'whatsapp',
      options: [
        { label: 'WhatsApp', value: 'whatsapp' },
        { label: 'Email', value: 'email' },
      ],
    },
    {
      name: 'missingFields',
      type: 'array',
      fields: [{ name: 'field', type: 'text', required: true }],
    },
    {
      name: 'messageTemplate',
      type: 'text',
      admin: { description: 'WhatsApp template name when using Cloud API' },
    },
    {
      name: 'messageBody',
      type: 'textarea',
    },
    {
      name: 'lastSentAt',
      type: 'date',
    },
    {
      name: 'replyReceivedAt',
      type: 'date',
    },
    {
      name: 'replyText',
      type: 'textarea',
    },
    {
      name: 'extractedData',
      type: 'json',
    },
    {
      name: 'confidenceScore',
      type: 'number',
      min: 0,
      max: 1,
    },
    {
      name: 'humanReviewReason',
      type: 'textarea',
    },
    {
      name: 'attemptCount',
      type: 'number',
      defaultValue: 0,
      min: 0,
    },
    {
      name: 'nextFollowUpAt',
      type: 'date',
    },
    {
      name: 'completedAt',
      type: 'date',
    },
    {
      name: 'errorLog',
      type: 'textarea',
    },
  ],
}
