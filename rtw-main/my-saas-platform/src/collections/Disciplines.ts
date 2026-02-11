import type { CollectionConfig } from 'payload'

import { hiddenFromBlogEditor } from '../access/hiddenFromBlogEditor'
import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'

export const Disciplines: CollectionConfig = {
  slug: 'disciplines',
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    hidden: hiddenFromBlogEditor,
    useAsTitle: 'name',
    defaultColumns: ['name', 'displayOrder', 'isHighlighted', 'updatedAt'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
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
      name: 'slug',
      type: 'text',
      unique: true,
      admin: {
        description: 'URL-friendly identifier (auto-generated from name if not provided)',
      },
    },
    {
      name: 'displayOrder',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Order in which to display disciplines (lower numbers appear first)',
      },
    },
    {
      name: 'isHighlighted',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Highlight this discipline with special styling on the homepage',
      },
    },
  ],
}













