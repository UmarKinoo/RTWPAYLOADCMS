import type { CollectionConfig } from 'payload'

const authenticated = ({ req }: { req: any }) => {
  return !!req.user
}

export const Employers: CollectionConfig = {
  slug: 'employers',
  auth: true,
  access: {
    create: () => true, // Allow public registration
    read: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    useAsTitle: 'companyName',
    defaultColumns: ['companyName', 'responsiblePerson', 'email', 'updatedAt'],
  },
  fields: [
    {
      name: 'responsiblePerson',
      type: 'text',
      label: 'Responsible Person',
      required: true,
    },
    {
      name: 'companyName',
      type: 'text',
      label: 'Company Name',
      required: true,
    },
    // Note: email and password are automatically added by Payload when auth: true
    {
      name: 'phone',
      type: 'text',
      label: 'Phone Number',
    },
    {
      name: 'website',
      type: 'text',
      label: 'Website',
    },
    {
      name: 'address',
      type: 'textarea',
      label: 'Company Address',
    },
    {
      name: 'industry',
      type: 'text',
      label: 'Industry',
    },
    {
      name: 'companySize',
      type: 'select',
      label: 'Company Size',
      options: [
        { label: '1-10 employees', value: '1-10' },
        { label: '11-50 employees', value: '11-50' },
        { label: '51-200 employees', value: '51-200' },
        { label: '201-500 employees', value: '201-500' },
        { label: '500+ employees', value: '500+' },
      ],
    },
    {
      name: 'termsAccepted',
      type: 'checkbox',
      label: 'Terms Accepted',
      defaultValue: false,
      required: true,
    },
    {
      name: 'wallet',
      type: 'group',
      label: 'Credits Wallet',
      fields: [
        {
          name: 'interviewCredits',
          type: 'number',
          label: 'Interview Credits',
          defaultValue: 0,
          required: true,
          admin: {
            description: 'Available interview credits',
          },
        },
        {
          name: 'contactUnlockCredits',
          type: 'number',
          label: 'Contact Unlock Credits',
          defaultValue: 0,
          required: true,
          admin: {
            description: 'Available contact unlock credits',
          },
        },
      ],
    },
    {
      name: 'activePlan',
      type: 'relationship',
      relationTo: 'plans',
      admin: {
        description: 'Currently active subscription plan',
      },
    },
    {
      name: 'features',
      type: 'group',
      label: 'Active Features',
      fields: [
        {
          name: 'basicFilters',
          type: 'checkbox',
          label: 'Basic Filters',
          defaultValue: false,
          admin: {
            description: 'Access to basic filtering options',
          },
        },
        {
          name: 'nationalityRestriction',
          type: 'select',
          label: 'Nationality Restriction',
          options: [
            { label: 'None', value: 'NONE' },
            { label: 'Saudi Only', value: 'SAUDI' },
          ],
          defaultValue: 'NONE',
          admin: {
            description: 'Nationality restriction for candidate access',
          },
        },
      ],
    },
  ],
}

