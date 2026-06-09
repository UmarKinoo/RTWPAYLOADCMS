import type { CollectionConfig } from 'payload'
import { hiddenFromBlogEditor } from '../access/hiddenFromBlogEditor'
import { allowOnlyAdmin } from '../access/allowOnlyAdmin'

export const AgentAuditLogs: CollectionConfig = {
  slug: 'agent-audit-logs',
  labels: {
    singular: 'Agent Audit Log',
    plural: 'Agent Audit Logs',
  },
  access: {
    create: allowOnlyAdmin,
    read: allowOnlyAdmin,
    update: () => false,
    delete: () => false,
  },
  admin: {
    group: 'ReadyBot',
    hidden: hiddenFromBlogEditor,
    useAsTitle: 'action',
    defaultColumns: ['action', 'candidate', 'toolUsed', 'confidence', 'createdAt'],
  },
  fields: [
    {
      name: 'agentName',
      type: 'text',
      defaultValue: 'ReadyBot',
      required: true,
    },
    {
      name: 'candidate',
      type: 'relationship',
      relationTo: 'candidates',
      index: true,
    },
    {
      name: 'screeningTask',
      type: 'relationship',
      relationTo: 'candidate-screening-tasks',
    },
    {
      name: 'action',
      type: 'text',
      required: true,
    },
    {
      name: 'beforeData',
      type: 'json',
    },
    {
      name: 'afterData',
      type: 'json',
    },
    {
      name: 'reason',
      type: 'textarea',
    },
    {
      name: 'confidence',
      type: 'number',
      min: 0,
      max: 1,
    },
    {
      name: 'modelUsed',
      type: 'text',
    },
    {
      name: 'toolUsed',
      type: 'text',
    },
  ],
  timestamps: true,
}
