import type { CollectionConfig } from 'payload'
import { hiddenFromBlogEditor } from '../access/hiddenFromBlogEditor'
import { allowOnlyAdmin } from '../access/allowOnlyAdmin'

export const Purchases: CollectionConfig = {
  slug: 'purchases',
  access: {
    read: allowOnlyAdmin,
    create: allowOnlyAdmin,
    update: allowOnlyAdmin,
    delete: allowOnlyAdmin,
  },
  admin: {
    hidden: hiddenFromBlogEditor,
    useAsTitle: 'id',
    defaultColumns: ['employer', 'plan', 'status', 'source', 'createdAt'],
  },
  fields: [
    {
      name: 'employer',
      type: 'relationship',
      relationTo: 'employers',
      required: true,
      admin: {
        description: 'The employer who made this purchase',
      },
    },
    {
      name: 'plan',
      type: 'relationship',
      relationTo: 'plans',
      required: true,
      admin: {
        description: 'The plan that was purchased',
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Active', value: 'active' },
        { label: 'Cancelled', value: 'cancelled' },
        { label: 'Failed', value: 'failed' },
      ],
      defaultValue: 'active',
      required: true,
      admin: {
        description: 'Purchase status',
      },
    },
    {
      name: 'paymentGatewayId',
      type: 'text',
      admin: {
        description: 'MyFatoorah InvoiceId or payment reference for callback matching',
      },
    },
    {
      name: 'creditsGranted',
      type: 'group',
      admin: {
        description: 'Snapshot of credits granted at time of purchase',
      },
      fields: [
        {
          name: 'interviewCreditsGranted',
          type: 'number',
          required: true,
          defaultValue: 0,
        },
        {
          name: 'contactUnlockCreditsGranted',
          type: 'number',
          required: true,
          defaultValue: 0,
        },
      ],
    },
    {
      name: 'source',
      type: 'select',
      options: [
        { label: 'MyFatoorah', value: 'myfatoorah' },
        { label: 'Mock Checkout', value: 'mock_checkout' },
        { label: 'Admin', value: 'admin' },
      ],
      defaultValue: 'mock_checkout',
      required: true,
      admin: {
        description: 'Source of the purchase',
      },
    },
  ],
  timestamps: true, // Adds createdAt and updatedAt automatically
}












