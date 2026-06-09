import type { CollectionConfig } from 'payload'
import { hiddenFromBlogEditor } from '../access/hiddenFromBlogEditor'

function isAdminUser(user: unknown): user is { id: string | number; role: string; collection: string } {
  if (!user || typeof user !== 'object') return false
  const u = user as { collection?: string; role?: string; id?: string | number }
  return u.collection === 'users' && u.role === 'admin' && u.id != null
}

export const ReadyBotOpsChatSessions: CollectionConfig = {
  slug: 'readybot-ops-chat-sessions',
  labels: {
    singular: 'ReadyBot Ops Chat',
    plural: 'ReadyBot Ops Chats',
  },
  access: {
    create: ({ req }) => isAdminUser(req.user),
    read: ({ req }) => {
      if (!isAdminUser(req.user)) return false
      return { user: { equals: req.user.id } }
    },
    update: ({ req }) => {
      if (!isAdminUser(req.user)) return false
      return { user: { equals: req.user.id } }
    },
    delete: ({ req }) => {
      if (!isAdminUser(req.user)) return false
      return { user: { equals: req.user.id } }
    },
  },
  admin: {
    group: 'ReadyBot',
    hidden: hiddenFromBlogEditor,
    useAsTitle: 'title',
    defaultColumns: ['title', 'user', 'updatedAt'],
  },
  timestamps: true,
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      defaultValue: 'New chat',
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'locale',
      type: 'text',
      defaultValue: 'en',
    },
    {
      name: 'messages',
      type: 'json',
      required: true,
      defaultValue: [],
    },
    {
      name: 'memorySummary',
      type: 'textarea',
      admin: {
        description: 'Rolling LLM summary of older turns (injected into new requests).',
      },
    },
    {
      name: 'keyFacts',
      type: 'json',
      admin: {
        description: 'Compact bullet facts extracted from the conversation.',
      },
    },
    {
      name: 'memoryCompactedAt',
      type: 'date',
      admin: {
        readOnly: true,
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
  ],
}
