import type { CollectionConfig } from 'payload'
import { hiddenFromBlogEditor } from '../access/hiddenFromBlogEditor'
import { allowOnlyAdmin } from '../access/allowOnlyAdmin'

export const HumanReviewTasks: CollectionConfig = {
  slug: 'human-review-tasks',
  labels: {
    singular: 'Human Review Task',
    plural: 'Human Review Tasks',
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
    defaultColumns: ['candidate', 'status', 'reason', 'reviewedAt', 'updatedAt'],
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
      name: 'reason',
      type: 'textarea',
      required: true,
    },
    {
      name: 'suggestedUpdate',
      type: 'json',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Edited and Approved', value: 'edited_and_approved' },
      ],
    },
    {
      name: 'reviewedBy',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'reviewedAt',
      type: 'date',
    },
    {
      name: 'adminNotes',
      type: 'textarea',
    },
  ],
}
