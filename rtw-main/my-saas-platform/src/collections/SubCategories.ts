import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'

export const SubCategories: CollectionConfig = {
  slug: 'subcategories',
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'updatedAt'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'English name (fallback if name_en is not set)',
      },
    },
    {
      name: 'name_en',
      type: 'text',
      required: false,
      admin: {
        description: 'English name (used when locale is "en")',
      },
    },
    {
      name: 'name_ar',
      type: 'text',
      required: false,
      admin: {
        description: 'Arabic name (used when locale is "ar")',
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
    },
  ],
}



















