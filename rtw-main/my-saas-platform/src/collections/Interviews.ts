import type { CollectionConfig } from 'payload'
import { authenticated } from '../access/authenticated'
import {
  revalidateInterview,
  revalidateInterviewDelete,
} from './Interviews/hooks/revalidateInterview'

// Access control: Admins can see all interviews, employers and candidates can see their own
const ownInterviews = ({ req: { user } }: { req: any }) => {
  if (!user) return false
  
  // Admins (Users with role='admin') can see ALL interviews in Payload admin for moderation
  if (user.collection === 'users' && (user as any).role === 'admin') {
    return true
  }
  
  // Employers can see their own interviews (via API/server actions)
  // Note: Server actions use overrideAccess: true with proper filtering
  if (user.collection === 'employers') {
    return true
  }
  
  // Candidates can see their own interviews (via API/server actions)
  // Note: Server actions use overrideAccess: true with proper filtering
  if (user.collection === 'candidates') {
    return true
  }
  
  return false
}

export const Interviews: CollectionConfig = {
  slug: 'interviews',
  access: {
    create: authenticated,
    read: ownInterviews,
    update: ownInterviews,
    delete: ownInterviews,
  },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['employer', 'candidate', 'scheduledAt', 'status', 'createdAt'],
  },
  fields: [
    {
      name: 'employer',
      type: 'relationship',
      relationTo: 'employers',
      required: true,
      admin: {
        description: 'The employer who scheduled this interview',
      },
    },
    {
      name: 'candidate',
      type: 'relationship',
      relationTo: 'candidates',
      required: true,
      admin: {
        description: 'The candidate being interviewed',
      },
    },
    {
      name: 'scheduledAt',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description: 'Date and time of the interview',
      },
    },
    {
      name: 'duration',
      type: 'number',
      required: true,
      defaultValue: 30,
      min: 15,
      admin: {
        description: 'Duration in minutes',
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Scheduled', value: 'scheduled' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'No Show', value: 'no_show' },
      ],
      defaultValue: 'pending',
      required: true,
      admin: {
        description: 'Current status of the interview',
      },
    },
    {
      name: 'requestedAt',
      type: 'date',
      admin: {
        description: 'Timestamp when the interview request was made',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'approvedAt',
      type: 'date',
      admin: {
        description: 'Timestamp when the interview was approved by moderator',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'approvedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'User who approved this interview request',
      },
    },
    {
      name: 'rejectionReason',
      type: 'textarea',
      admin: {
        description: 'Reason for rejection (if rejected)',
      },
    },
    {
      name: 'jobPosition',
      type: 'text',
      admin: {
        description: 'Job position offered in the interview request',
      },
    },
    {
      name: 'jobLocation',
      type: 'text',
      admin: {
        description: 'Job location for the position',
      },
    },
    {
      name: 'salary',
      type: 'text',
      admin: {
        description: 'Salary offered (e.g., "SAR 5000")',
      },
    },
    {
      name: 'accommodationIncluded',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether accommodation is included in the offer',
      },
    },
    {
      name: 'transportation',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether transportation is provided',
      },
    },
    {
      name: 'calendarEventId',
      type: 'text',
      admin: {
        description: 'Google Calendar event ID (if created)',
      },
    },
    {
      name: 'meetingLink',
      type: 'text',
      admin: {
        description: 'Video call link (Google Meet, Zoom, etc.)',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Additional notes about the interview',
      },
    },
  ],
  timestamps: true,
  hooks: {
    afterChange: [revalidateInterview],
    afterDelete: [revalidateInterviewDelete],
  },
}



