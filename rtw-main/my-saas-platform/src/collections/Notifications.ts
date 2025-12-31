import type { CollectionConfig } from 'payload'
import { authenticated } from '../access/authenticated'
import {
  revalidateNotification,
  revalidateNotificationDelete,
} from './Notifications/hooks/revalidateNotification'

// Access control: Employers and candidates can access their own notifications
const ownNotifications = ({ req: { user } }: { req: any }) => {
  if (!user) return false
  if (user.collection === 'employers' || user.collection === 'candidates') return true
  return false
}

export const Notifications: CollectionConfig = {
  slug: 'notifications',
  access: {
    create: authenticated,
    read: ownNotifications,
    update: ownNotifications,
    delete: ownNotifications,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['employer', 'candidate', 'type', 'title', 'read', 'createdAt'],
  },
  fields: [
    {
      name: 'employer',
      type: 'relationship',
      relationTo: 'employers',
      admin: {
        description: 'The employer who receives this notification (optional if candidate notification)',
      },
    },
    {
      name: 'candidate',
      type: 'relationship',
      relationTo: 'candidates',
      admin: {
        description: 'The candidate who receives this notification (optional if employer notification)',
      },
    },
    {
      name: 'type',
      type: 'select',
      options: [
        { label: 'Interview Scheduled', value: 'interview_scheduled' },
        { label: 'Interview Reminder', value: 'interview_reminder' },
        { label: 'Interview Request Received', value: 'interview_request_received' },
        { label: 'Interview Request Approved', value: 'interview_request_approved' },
        { label: 'Interview Request Rejected', value: 'interview_request_rejected' },
        { label: 'Candidate Applied', value: 'candidate_applied' },
        { label: 'Credit Low', value: 'credit_low' },
        { label: 'System', value: 'system' },
      ],
      required: true,
      admin: {
        description: 'Type of notification',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Notification title',
      },
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Notification message',
      },
    },
    {
      name: 'read',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether the notification has been read',
      },
    },
    {
      name: 'actionUrl',
      type: 'text',
      admin: {
        description: 'Optional URL to navigate when notification is clicked',
      },
    },
  ],
  timestamps: true,
  hooks: {
    beforeValidate: [
      ({ data }) => {
        // Ensure either employer or candidate is set
        if (!data.employer && !data.candidate) {
          throw new Error('Either employer or candidate must be set for a notification')
        }
        if (data.employer && data.candidate) {
          throw new Error('Notification cannot have both employer and candidate')
        }
        return data
      },
    ],
    afterChange: [revalidateNotification],
    afterDelete: [revalidateNotificationDelete],
  },
}



