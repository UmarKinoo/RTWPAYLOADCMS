import type { CollectionConfig } from 'payload'
import { allowOnlyAdmin } from '../../access/allowOnlyAdmin'
import { anyone } from '../../access/anyone'

/**
 * Reusable qualification-question templates keyed by ESCO occupation URI + language.
 * Generated once by AI, then reused for every candidate selecting that occupation.
 * Admins can disable or delete a template to force regeneration.
 */
export const QualificationTemplates: CollectionConfig = {
  slug: 'qualification-templates',
  admin: {
    useAsTitle: 'occupationLabel',
    group: 'ESCO',
    defaultColumns: ['occupationLabel', 'language', 'status', 'promptVersion', 'lastUsedAt'],
    description: 'AI-generated qualification forms cached per ESCO occupation + language.',
  },
  access: {
    read: anyone,
    create: allowOnlyAdmin,
    update: allowOnlyAdmin,
    delete: allowOnlyAdmin,
  },
  fields: [
    {
      name: 'escoUri',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'ESCO occupation URI — primary cache key.',
      },
    },
    {
      name: 'occupationLabel',
      type: 'text',
      required: true,
    },
    {
      name: 'language',
      type: 'text',
      required: true,
      index: true,
      defaultValue: 'en',
    },
    {
      name: 'promptVersion',
      type: 'text',
      required: true,
      defaultValue: '1.0',
    },
    {
      name: 'schemaVersion',
      type: 'text',
      required: true,
      defaultValue: '1',
    },
    {
      name: 'escoChecksum',
      type: 'text',
      required: true,
      admin: {
        description: 'SHA-256 of occupation title + description + skill URIs. Mismatch triggers regeneration.',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Disabled', value: 'disabled' },
      ],
    },
    {
      name: 'questions',
      type: 'array',
      required: true,
      minRows: 6,
      maxRows: 12,
      admin: {
        description: 'Ordered list of qualification questions for this occupation.',
      },
      fields: [
        {
          name: 'questionId',
          type: 'text',
          required: true,
          admin: { description: 'Stable snake_case id (e.g. experience_years).' },
        },
        {
          name: 'category',
          type: 'select',
          required: true,
          options: [
            { label: 'Experience', value: 'experience' },
            { label: 'Tasks', value: 'tasks' },
            { label: 'Equipment', value: 'equipment' },
            { label: 'Licence', value: 'licence' },
            { label: 'Environment', value: 'environment' },
            { label: 'Verification', value: 'verification' },
            { label: 'Availability', value: 'availability' },
          ],
        },
        {
          name: 'type',
          type: 'select',
          required: true,
          options: [
            { label: 'Single select', value: 'single_select' },
            { label: 'Multi select', value: 'multi_select' },
            { label: 'Yes / No', value: 'yes_no' },
            { label: 'Number range', value: 'number_range' },
            { label: 'Date', value: 'date' },
            { label: 'Short text', value: 'short_text' },
          ],
        },
        {
          name: 'label',
          type: 'text',
          required: true,
        },
        {
          name: 'options',
          type: 'array',
          required: false,
          fields: [{ name: 'value', type: 'text', required: true }],
        },
        {
          name: 'required',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'order',
          type: 'number',
          required: true,
          defaultValue: 0,
        },
        {
          name: 'showWhen',
          type: 'group',
          admin: {
            description: 'Optional conditional rule — show this question only when another answer matches.',
          },
          fields: [
            { name: 'questionId', type: 'text', required: false },
            {
              name: 'operator',
              type: 'select',
              required: false,
              options: [
                { label: 'Equals', value: 'equals' },
                { label: 'Includes', value: 'includes' },
                { label: 'Not equals', value: 'not_equals' },
              ],
            },
            {
              name: 'value',
              type: 'text',
              required: false,
              admin: { description: 'Stored as text; "true"/"false" for yes_no parents.' },
            },
          ],
        },
        {
          name: 'sourceSkillUris',
          type: 'array',
          required: false,
          fields: [{ name: 'uri', type: 'text', required: true }],
        },
      ],
    },
    {
      name: 'generatedAt',
      type: 'date',
      required: true,
    },
    {
      name: 'lastUsedAt',
      type: 'date',
      required: false,
    },
  ],
}
