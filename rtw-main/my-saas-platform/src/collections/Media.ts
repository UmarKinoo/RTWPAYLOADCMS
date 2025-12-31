import type { CollectionConfig } from 'payload'
import { authenticated } from '../access/authenticated'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
    create: authenticated, // Allow authenticated users to upload files (for CVs, etc.)
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: false, // Optional - not needed for CVs/documents, only for images
    },
  ],
  upload: true,
}
