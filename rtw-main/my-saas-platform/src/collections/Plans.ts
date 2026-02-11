import type { CollectionConfig } from 'payload'
import { hiddenFromBlogEditor } from '../access/hiddenFromBlogEditor'
import { allowOnlyAdmin } from '../access/allowOnlyAdmin'
import { anyone } from '../access/anyone'
import {
  revalidatePlan,
  revalidatePlanDelete,
} from './Plans/hooks/revalidatePlan'

export const Plans: CollectionConfig = {
  slug: 'plans',
  access: {
    read: anyone, // Public read for pricing page
    create: allowOnlyAdmin,
    update: allowOnlyAdmin,
    delete: allowOnlyAdmin,
  },
  admin: {
    hidden: hiddenFromBlogEditor,
    useAsTitle: 'title',
    defaultColumns: ['slug', 'title', 'price', 'currency', 'updatedAt'],
  },
  fields: [
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Unique identifier for the plan (e.g., skilled, specialty, elite-specialty)',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'English name (fallback if title_en is not set)',
      },
    },
    {
      name: 'title_en',
      type: 'text',
      required: false,
      admin: {
        description: 'English name (used when locale is "en")',
      },
    },
    {
      name: 'title_ar',
      type: 'text',
      required: false,
      admin: {
        description: 'Arabic name (used when locale is "ar")',
      },
    },
    {
      name: 'price',
      type: 'number',
      admin: {
        description: 'Price in SAR. Leave null for custom plans.',
      },
    },
    {
      name: 'currency',
      type: 'text',
      required: true,
      defaultValue: 'SAR',
      admin: {
        description: 'Currency code (default: SAR)',
      },
    },
    {
      name: 'entitlements',
      type: 'group',
      fields: [
        {
          name: 'interviewCreditsGranted',
          type: 'number',
          required: true,
          defaultValue: 0,
          admin: {
            description: 'Number of interview credits granted with this plan',
          },
        },
        {
          name: 'contactUnlockCreditsGranted',
          type: 'number',
          required: true,
          defaultValue: 0,
          admin: {
            description: 'Number of contact unlock credits granted with this plan',
          },
        },
        {
          name: 'basicFilters',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Whether basic filters are enabled',
          },
        },
        {
          name: 'nationalityRestriction',
          type: 'select',
          options: [
            { label: 'None', value: 'NONE' },
            { label: 'Saudi Only', value: 'SAUDI' },
          ],
          defaultValue: 'NONE',
          admin: {
            description: 'Nationality restriction for candidate access',
          },
        },
        {
          name: 'isCustom',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Whether this is a custom plan (no credits granted, routes to request form)',
          },
        },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidatePlan],
    afterDelete: [revalidatePlanDelete],
  },
}

