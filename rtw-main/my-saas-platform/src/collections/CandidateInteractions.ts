import type { CollectionConfig } from 'payload'
import { authenticated } from '../access/authenticated'
import {
  revalidateCandidateInteraction,
  revalidateCandidateInteractionDelete,
} from './CandidateInteractions/hooks/revalidateCandidateInteraction'

// Access control: Employers can only access their own interactions
const ownInteractions = ({ req: { user } }: { req: any }) => {
  if (!user) return false
  if (user.collection === 'employers') return true
  return false
}

export const CandidateInteractions: CollectionConfig = {
  slug: 'candidate-interactions',
  access: {
    create: authenticated,
    read: ownInteractions,
    update: ownInteractions,
    delete: ownInteractions,
  },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['employer', 'candidate', 'interactionType', 'createdAt'],
  },
  fields: [
    {
      name: 'employer',
      type: 'relationship',
      relationTo: 'employers',
      required: true,
      admin: {
        description: 'The employer who performed this interaction',
      },
    },
    {
      name: 'candidate',
      type: 'relationship',
      relationTo: 'candidates',
      required: true,
      admin: {
        description: 'The candidate involved in this interaction',
      },
    },
    {
      name: 'interactionType',
      type: 'select',
      options: [
        { label: 'View', value: 'view' },
        { label: 'Interview Requested', value: 'interview_requested' },
        { label: 'Interviewed', value: 'interviewed' },
        { label: 'Declined', value: 'declined' },
        { label: 'Contact Unlocked', value: 'contact_unlocked' },
      ],
      required: true,
      admin: {
        description: 'Type of interaction',
      },
    },
    {
      name: 'metadata',
      type: 'json',
      admin: {
        description: 'Additional metadata (e.g., job posting ID, search filters)',
      },
    },
  ],
  timestamps: true,
  hooks: {
    afterChange: [revalidateCandidateInteraction],
    afterDelete: [revalidateCandidateInteractionDelete],
  },
}






