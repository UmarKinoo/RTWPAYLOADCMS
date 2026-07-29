import type { CollectionConfig } from 'payload'
import { allowOnlyAdmin } from '../../access/allowOnlyAdmin'
import { anyone } from '../../access/anyone'

/**
 * Admin-managed aliases that map informal job names to ESCO search terms.
 * Consulted before the AI interpreter so common phrases resolve instantly.
 *
 * Examples:
 *   "ac worker"       → ["air conditioning technician", "HVAC technician"]
 *   "forklift driver" → ["forklift operator", "industrial truck driver"]
 *   "housemaid"       → ["domestic housekeeper", "domestic cleaner"]
 */
export const EscoAliases: CollectionConfig = {
  slug: 'esco-aliases',
  admin: {
    useAsTitle: 'aliasTerm',
    group: 'ESCO',
    defaultColumns: ['aliasTerm', 'active', 'updatedAt'],
    description: 'Map informal job names to ESCO-compatible search terms.',
  },
  access: {
    read: anyone,
    create: allowOnlyAdmin,
    update: allowOnlyAdmin,
    delete: allowOnlyAdmin,
  },
  fields: [
    {
      name: 'aliasTerm',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Lowercase, trimmed informal phrase (e.g. "ac worker")',
      },
    },
    {
      name: 'searchTerms',
      type: 'array',
      required: true,
      minRows: 1,
      maxRows: 8,
      admin: {
        description: 'ESCO-compatible English search terms to use instead of AI interpretation.',
      },
      fields: [
        {
          name: 'term',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'pinnedOccupationUris',
      type: 'array',
      required: false,
      admin: {
        description: 'Optional ESCO occupation URIs to pin to the top of results.',
      },
      fields: [
        {
          name: 'uri',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Disable to stop using this alias without deleting it.',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      required: false,
      admin: {
        description: 'Internal notes about this alias.',
      },
    },
  ],
}
