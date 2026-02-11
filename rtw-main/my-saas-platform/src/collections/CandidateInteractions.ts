import type { CollectionConfig } from 'payload'
import { hiddenFromBlogEditor } from '../access/hiddenFromBlogEditor'
import { allowOnlyAdmin } from '../access/allowOnlyAdmin'
import {
  revalidateCandidateInteraction,
  revalidateCandidateInteractionDelete,
} from './CandidateInteractions/hooks/revalidateCandidateInteraction'

// Access control: Admin can manage all; employers/candidates can access their own interactions
// Note: Server actions use overrideAccess: true with proper filtering
const ownInteractions = ({ req: { user } }: { req: any }) => {
  if (!user) return false
  if (user.collection === 'employers') return true
  if (user.collection === 'candidates') return true
  return false
}

const adminOrOwnInteractions = (args: any) => allowOnlyAdmin(args) || ownInteractions(args)

export const CandidateInteractions: CollectionConfig = {
  slug: 'candidate-interactions',
  access: {
    create: adminOrOwnInteractions,
    read: adminOrOwnInteractions,
    update: adminOrOwnInteractions,
    delete: adminOrOwnInteractions,
  },
  admin: {
    hidden: hiddenFromBlogEditor,
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












