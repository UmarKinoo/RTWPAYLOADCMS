import type { CollectionBeforeDeleteHook, CollectionConfig } from 'payload'
import { allowOnlyAdmin } from '../../access/allowOnlyAdmin'

/**
 * Remove linked skills and qualification answers before the occupation itself
 * is deleted. Relationship columns are NOT NULL, so Postgres' ON DELETE SET NULL
 * would otherwise abort the delete and leave the record undeletable from admin.
 */
const deleteLinkedChildren: CollectionBeforeDeleteHook = async ({ id, req }) => {
  await req.payload.delete({
    collection: 'candidate-occupation-skills',
    where: { candidateOccupation: { equals: id } },
    req,
  })
  await req.payload.delete({
    collection: 'candidate-qualification-answers',
    where: { candidateOccupation: { equals: id } },
    req,
  })
}

/**
 * Stores ESCO occupations declared by candidates.
 * Each document represents one occupation for one candidate session.
 * Skills are stored separately in candidate-occupation-skills.
 */
export const CandidateOccupations: CollectionConfig = {
  slug: 'candidate-occupations',
  admin: {
    useAsTitle: 'preferredLabel',
    group: 'ESCO',
    defaultColumns: ['preferredLabel', 'language', 'source', 'verificationStatus', 'createdAt'],
    description: 'ESCO occupations declared by candidates (anonymous demo or logged-in).',
  },
  access: {
    read: allowOnlyAdmin,
    create: () => true,
    update: allowOnlyAdmin,
    delete: allowOnlyAdmin,
  },
  hooks: {
    beforeDelete: [deleteLinkedChildren],
  },
  fields: [
    {
      name: 'sessionId',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'Client-side session identifier (from localStorage).',
      },
    },
    {
      name: 'candidate',
      type: 'relationship',
      relationTo: 'candidates',
      required: false,
      index: true,
      admin: {
        description: 'Main candidate profile this occupation belongs to (set once the account is created).',
      },
    },
    {
      name: 'escoUri',
      type: 'text',
      required: false,
      index: true,
      admin: {
        description: 'ESCO occupation URI — permanent identifier. Empty only for unmapped occupations.',
      },
    },
    {
      name: 'preferredLabel',
      type: 'text',
      required: true,
      admin: {
        description: "ESCO preferred label in the candidate's language.",
      },
    },
    {
      name: 'language',
      type: 'text',
      required: true,
      defaultValue: 'en',
      admin: {
        description: 'Language code used when fetching from ESCO (e.g. en, ar).',
      },
    },
    {
      name: 'originalWording',
      type: 'text',
      required: false,
      admin: {
        description: "Candidate's original free-text input that led to this occupation.",
      },
    },
    {
      name: 'source',
      type: 'select',
      required: true,
      defaultValue: 'candidate-declared',
      options: [
        { label: 'Candidate Declared', value: 'candidate-declared' },
        { label: 'Unmapped (custom title)', value: 'unmapped' },
      ],
    },
    {
      name: 'customTitle',
      type: 'text',
      required: false,
      admin: {
        description: "Custom job title when the candidate couldn't find their occupation in ESCO.",
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
