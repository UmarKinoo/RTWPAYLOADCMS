import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { linkGroup } from '@/fields/linkGroup'

export const Hero: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  fields: [
    {
      name: 'title',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [
            ...rootFeatures,
            HeadingFeature({ enabledHeadingSizes: ['h1', 'h2'] }),
            FixedToolbarFeature(),
            InlineToolbarFeature(),
          ]
        },
      }),
      label: 'Title',
      required: true,
    },
    {
      name: 'subtitle',
      type: 'textarea',
      label: 'Subtitle',
      required: false,
    },
    {
      name: 'backgroundImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Background Image',
      required: true,
    },
    {
      name: 'overlayOpacity',
      type: 'number',
      label: 'Overlay Opacity',
      admin: {
        description: 'Opacity of the dark overlay (0-100)',
        step: 5,
      },
      defaultValue: 36,
      max: 100,
      min: 0,
    },
    linkGroup({
      appearances: ['default', 'outline'],
      overrides: {
        maxRows: 2,
        label: 'Call to Action Buttons',
        admin: {
          description: 'Add up to 2 CTA buttons (e.g., "For Employer", "For Candidates")',
        },
      },
    }),
    {
      name: 'enableSearch',
      type: 'checkbox',
      label: 'Enable Search Section',
      defaultValue: false,
    },
    {
      name: 'searchPlaceholder',
      type: 'text',
      label: 'Search Placeholder Text',
      admin: {
        condition: (_, { enableSearch }) => enableSearch,
      },
      defaultValue: 'Smart Search',
    },
  ],
  labels: {
    plural: 'Hero Sections',
    singular: 'Hero',
  },
}



