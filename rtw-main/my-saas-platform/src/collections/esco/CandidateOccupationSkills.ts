import type { CollectionConfig } from 'payload'
import { allowOnlyAdmin } from '../../access/allowOnlyAdmin'

/**
 * Stores ESCO skills selected by a candidate under a specific occupation.
 * Kept as a separate collection so recruiter matching can query skill URIs
 * independently of occupation documents.
 */
export const CandidateOccupationSkills: CollectionConfig = {
  slug: 'candidate-occupation-skills',
  admin: {
    useAsTitle: 'skillLabel',
    group: 'ESCO',
    defaultColumns: ['skillLabel', 'skillType', 'candidateSelected', 'verificationStatus', 'createdAt'],
    description: 'ESCO skills selected by candidates, linked to their occupation.',
  },
  access: {
    read: allowOnlyAdmin,
    create: () => true,
    update: allowOnlyAdmin,
    delete: allowOnlyAdmin,
  },
  fields: [
    {
      name: 'candidateOccupation',
      type: 'relationship',
      relationTo: 'candidate-occupations',
      required: true,
      index: true,
      admin: {
        description: 'The occupation this skill belongs to.',
      },
    },
    {
      name: 'escoSkillUri',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'ESCO skill URI — permanent identifier.',
      },
    },
    {
      name: 'skillLabel',
      type: 'text',
      required: true,
    },
    {
      name: 'skillType',
      type: 'select',
      required: true,
      options: [
        { label: 'Essential', value: 'essential' },
        { label: 'Optional', value: 'optional' },
      ],
    },
    {
      name: 'candidateSelected',
      type: 'checkbox',
      required: true,
      defaultValue: true,
      admin: {
        description: 'Whether the candidate indicated they have this skill.',
      },
    },
    {
      name: 'verificationStatus',
      type: 'select',
      required: true,
      defaultValue: 'unverified',
      options: [
        { label: 'Unverified', value: 'unverified' },
        { label: 'Verified', value: 'verified' },
        { label: 'Rejected', value: 'rejected' },
      ],
    },
  ],
}
