import type { CollectionConfig } from 'payload'
import { authenticated } from '../access/authenticated'
import {
  revalidateJobPosting,
  revalidateJobPostingDelete,
} from './JobPostings/hooks/revalidateJobPosting'

// Access control: Employers can only access their own job postings
const ownJobPostings = ({ req: { user } }: { req: any }) => {
  if (!user) return false
  if (user.collection === 'employers') return true
  return false
}

export const JobPostings: CollectionConfig = {
  slug: 'job-postings',
  access: {
    create: authenticated,
    read: ownJobPostings,
    update: ownJobPostings,
    delete: ownJobPostings,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['employer', 'title', 'jobType', 'status', 'applicationsCount', 'createdAt'],
  },
  fields: [
    {
      name: 'employer',
      type: 'relationship',
      relationTo: 'employers',
      required: true,
      admin: {
        description: 'The employer who created this job posting',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Job title',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Job description',
      },
    },
    {
      name: 'jobType',
      type: 'select',
      options: [
        { label: 'Full Time', value: 'full_time' },
        { label: 'Part Time', value: 'part_time' },
        { label: 'Contract', value: 'contract' },
      ],
      required: true,
      defaultValue: 'full_time',
      admin: {
        description: 'Type of employment',
      },
    },
    {
      name: 'salaryMin',
      type: 'number',
      min: 0,
      admin: {
        description: 'Minimum salary',
      },
    },
    {
      name: 'salaryMax',
      type: 'number',
      min: 0,
      admin: {
        description: 'Maximum salary',
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Paused', value: 'paused' },
        { label: 'Closed', value: 'closed' },
      ],
      defaultValue: 'active',
      required: true,
      admin: {
        description: 'Job posting status',
      },
    },
    {
      name: 'applicationsCount',
      type: 'number',
      defaultValue: 0,
      min: 0,
      admin: {
        description: 'Number of applications received',
        readOnly: true,
      },
    },
    {
      name: 'clicksCount',
      type: 'number',
      defaultValue: 0,
      min: 0,
      admin: {
        description: 'Number of clicks/views',
        readOnly: true,
      },
    },
    {
      name: 'expiresAt',
      type: 'date',
      admin: {
        description: 'Expiration date for the job posting',
      },
    },
  ],
  timestamps: true,
  hooks: {
    afterChange: [revalidateJobPosting],
    afterDelete: [revalidateJobPostingDelete],
  },
}







