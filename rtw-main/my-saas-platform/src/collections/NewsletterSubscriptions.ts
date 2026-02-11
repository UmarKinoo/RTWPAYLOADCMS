import type { CollectionConfig } from 'payload'
import { hiddenFromBlogEditor } from '../access/hiddenFromBlogEditor'
import { allowOnlyAdmin } from '../access/allowOnlyAdmin'

export const NewsletterSubscriptions: CollectionConfig = {
  slug: 'newsletter-subscriptions',
  admin: {
    hidden: hiddenFromBlogEditor,
    useAsTitle: 'email',
    defaultColumns: ['email', 'subscribed', 'subscribedAt', 'unsubscribedAt', 'createdAt'],
  },
  access: {
    read: allowOnlyAdmin,
    create: () => true, // Public subscribe
    update: allowOnlyAdmin,
    delete: allowOnlyAdmin,
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Subscriber email address',
      },
    },
    {
      name: 'subscribed',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether the user is currently subscribed',
      },
    },
    {
      name: 'subscribedAt',
      type: 'date',
      admin: {
        description: 'When the user first subscribed',
      },
      hooks: {
        beforeChange: [
          ({ value, operation }) => {
            // Set subscribedAt on create if not provided
            if (operation === 'create' && !value) {
              return new Date().toISOString()
            }
            return value
          },
        ],
      },
    },
    {
      name: 'unsubscribedAt',
      type: 'date',
      admin: {
        description: 'When the user unsubscribed (if applicable)',
      },
    },
    {
      name: 'source',
      type: 'text',
      admin: {
        description: 'Where the subscription came from (e.g., homepage, footer)',
      },
    },
  ],
  timestamps: true,
}
