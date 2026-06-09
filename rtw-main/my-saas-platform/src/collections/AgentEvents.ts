import type { CollectionConfig } from 'payload'
import { allowOnlyAdmin } from '../access/allowOnlyAdmin'
import { hiddenFromBlogEditor } from '../access/hiddenFromBlogEditor'

export const AgentEvents: CollectionConfig = {
  slug: 'agent-events',
  labels: {
    singular: 'Agent Event',
    plural: 'Agent Events',
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
    useAsTitle: 'event_type',
    defaultColumns: ['event_type', 'candidate', 'session_id', 'createdAt'],
  },
  fields: [
    {
      name: 'event_type',
      type: 'select',
      required: true,
      index: true,
      options: [
        { label: 'User Message', value: 'user_message' },
        { label: 'Assistant Message', value: 'assistant_message' },
        { label: 'Candidate Message', value: 'candidate_message' },
        { label: 'Bot Message', value: 'bot_message' },
        { label: 'Tool Call', value: 'tool_call' },
        { label: 'Tool Result', value: 'tool_result' },
        { label: 'Profile Update', value: 'profile_update' },
        { label: 'Score Update', value: 'score_update' },
        { label: 'Status Change', value: 'status_change' },
        { label: 'Permission Decision', value: 'permission_decision' },
        { label: 'Compaction Event', value: 'compaction_event' },
        { label: 'Error', value: 'error' },
        { label: 'Resume Marker', value: 'resume_marker' },
        { label: 'Human Override', value: 'human_override' },
      ],
    },
    {
      name: 'candidate',
      type: 'relationship',
      relationTo: 'candidates',
      index: true,
    },
    {
      name: 'job',
      type: 'relationship',
      relationTo: 'job-postings',
    },
    {
      name: 'conversation_id',
      type: 'text',
      index: true,
    },
    {
      name: 'session_id',
      type: 'text',
      index: true,
    },
    {
      name: 'payload',
      type: 'json',
      required: true,
    },
  ],
  timestamps: true,
}
