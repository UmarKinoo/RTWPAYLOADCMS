import type { CollectionConfig } from 'payload'
import { hiddenFromBlogEditor } from '../access/hiddenFromBlogEditor'

export const ContactSubmissions: CollectionConfig = {
  slug: 'contact-submissions',
  admin: {
    hidden: hiddenFromBlogEditor,
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'phone', 'title', 'createdAt'],
  },
  access: {
    read: () => true, // Allow reading for admin
    create: () => true, // Allow public creation via API
    update: () => false, // Only via API endpoints
    delete: () => false, // Only via API endpoints
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Contact name',
      },
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      admin: {
        description: 'Contact email address',
      },
    },
    {
      name: 'phone',
      type: 'text',
      required: true,
      admin: {
        description: 'Contact phone number',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Contact job title',
      },
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Contact message',
      },
    },
    {
      name: 'read',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether the submission has been read',
      },
    },
  ],
  timestamps: true,
}
