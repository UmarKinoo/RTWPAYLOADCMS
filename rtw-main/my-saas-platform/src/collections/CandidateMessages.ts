import type { CollectionConfig } from 'payload'
import { hiddenFromBlogEditor } from '../access/hiddenFromBlogEditor'
import { allowOnlyAdmin } from '../access/allowOnlyAdmin'

export const CandidateMessages: CollectionConfig = {
  slug: 'candidate-messages',
  labels: {
    singular: 'Candidate Message',
    plural: 'Candidate Messages',
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
    defaultColumns: ['candidate', 'direction', 'channel', 'status', 'sentAt', 'receivedAt'],
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
      name: 'screeningTask',
      type: 'relationship',
      relationTo: 'candidate-screening-tasks',
    },
    {
      name: 'channel',
      type: 'select',
      required: true,
      options: [
        { label: 'WhatsApp', value: 'whatsapp' },
        { label: 'Email', value: 'email' },
      ],
    },
    {
      name: 'direction',
      type: 'select',
      required: true,
      options: [
        { label: 'Inbound', value: 'inbound' },
        { label: 'Outbound', value: 'outbound' },
      ],
    },
    {
      name: 'from',
      type: 'text',
    },
    {
      name: 'to',
      type: 'text',
    },
    {
      name: 'subject',
      type: 'text',
    },
    {
      name: 'body',
      type: 'textarea',
      required: true,
    },
    {
      name: 'externalMessageId',
      type: 'text',
      index: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Sent', value: 'sent' },
        { label: 'Delivered', value: 'delivered' },
        { label: 'Read', value: 'read' },
        { label: 'Failed', value: 'failed' },
        { label: 'Received', value: 'received' },
      ],
    },
    {
      name: 'rawPayload',
      type: 'json',
    },
    {
      name: 'sentAt',
      type: 'date',
    },
    {
      name: 'receivedAt',
      type: 'date',
    },
  ],
}
