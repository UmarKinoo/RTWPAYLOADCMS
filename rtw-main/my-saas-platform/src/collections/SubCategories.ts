import type { CollectionConfig } from 'payload'

import { hiddenFromBlogEditor } from '../access/hiddenFromBlogEditor'
import { allowOnlyAdmin } from '../access/allowOnlyAdmin'
import { anyone } from '../access/anyone'

export const SubCategories: CollectionConfig = {
  slug: 'subcategories',
  access: {
    read: anyone,
    create: allowOnlyAdmin,
    update: allowOnlyAdmin,
    delete: allowOnlyAdmin,
  },
  admin: {
    hidden: hiddenFromBlogEditor,
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



















