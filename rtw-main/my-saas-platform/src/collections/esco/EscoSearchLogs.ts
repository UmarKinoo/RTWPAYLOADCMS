import type { CollectionConfig } from 'payload'
import { allowOnlyAdmin } from '../../access/allowOnlyAdmin'

/**
 * Immutable audit log of every ESCO occupation search.
 * Used by admins to:
 *   - spot informal phrases that return poor results
 *   - identify zero-result searches
 *   - track "not listed" selections
 *   - improve aliases over time
 */
export const EscoSearchLogs: CollectionConfig = {
  slug: 'esco-search-logs',
  admin: {
    useAsTitle: 'originalInput',
    group: 'ESCO',
    defaultColumns: ['originalInput', 'detectedLanguage', 'resultCount', 'selectedOccupationLabel', 'notListed', 'aiFailed', 'escoFailed', 'createdAt'],
    description: 'Read-only search log. Use to find poor results and improve aliases.',
  },
  access: {
    // Only admin can read/create; no update/delete to keep the log immutable
    read: allowOnlyAdmin,
    create: () => true,
    update: () => false,
    delete: allowOnlyAdmin,
  },
  fields: [
    {
      name: 'originalInput',
      type: 'text',
      required: true,
    },
    {
      name: 'detectedLanguage',
      type: 'text',
      required: false,
    },
    {
      name: 'aiSearchTerms',
      type: 'json',
      required: false,
      admin: {
        description: 'Array of search terms produced by the AI interpreter.',
      },
    },
    {
      name: 'escoQueries',
      type: 'json',
      required: false,
      admin: {
        description: 'Actual queries sent to the ESCO API.',
      },
    },
    {
      name: 'resultCount',
      type: 'number',
      required: false,
    },
    {
      name: 'topResultUris',
      type: 'json',
      required: false,
      admin: {
        description: 'URIs of the top occupation results shown to the candidate.',
      },
    },
    {
      name: 'selectedOccupationUri',
      type: 'text',
      required: false,
    },
    {
      name: 'selectedOccupationLabel',
      type: 'text',
      required: false,
    },
    {
      name: 'notListed',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Candidate chose "I cannot find my occupation".',
      },
    },
    {
      name: 'customTitle',
      type: 'text',
      required: false,
      admin: {
        description: 'Custom title entered when notListed is true.',
      },
    },
    {
      name: 'durationMs',
      type: 'number',
      required: false,
    },
    {
      name: 'aiFailed',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'escoFailed',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'sessionId',
      type: 'text',
      required: false,
      admin: {
        description: 'Anonymous session ID from localStorage.',
      },
    },
  ],
}
