import type { CollectionConfig } from 'payload'
import { hiddenFromBlogEditor } from '../access/hiddenFromBlogEditor'
import { allowOnlyAdmin } from '../access/allowOnlyAdmin'

export const PhoneVerifications: CollectionConfig = {
  slug: 'phone-verifications',
  admin: {
    hidden: hiddenFromBlogEditor,
    useAsTitle: 'phone',
    defaultColumns: ['phone', 'userCollection', 'verifiedAt', 'expiresAt', 'attempts', 'createdAt'],
  },
  access: {
    read: allowOnlyAdmin,
    create: allowOnlyAdmin,
    update: allowOnlyAdmin,
    delete: allowOnlyAdmin,
  },
  fields: [
    {
      name: 'phone',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'Phone number in E.164 format (e.g., +9665xxxxxxx)',
      },
    },
    {
      name: 'userId',
      type: 'text',
      admin: {
        description: 'ID of the user requesting verification',
      },
    },
    {
      name: 'userCollection',
      type: 'select',
      options: [
        { label: 'Candidates', value: 'candidates' },
        { label: 'Employers', value: 'employers' },
      ],
      admin: {
        description: 'Collection type of the user (Users collection not supported for phone verification)',
      },
    },
    {
      name: 'otpHash',
      type: 'text',
      required: true,
      admin: {
        hidden: true,
        description: 'SHA256 hash of OTP + salt',
      },
    },
    {
      name: 'otpSalt',
      type: 'text',
      required: true,
      admin: {
        hidden: true,
        description: 'Random salt for OTP hashing',
      },
    },
    {
      name: 'expiresAt',
      type: 'date',
      required: true,
      admin: {
        description: 'OTP expiration timestamp',
      },
    },
    {
      name: 'attempts',
      type: 'number',
      required: true,
      defaultValue: 0,
      admin: {
        description: 'Number of verification attempts',
      },
    },
    {
      name: 'verifiedAt',
      type: 'date',
      admin: {
        description: 'Timestamp when OTP was successfully verified',
      },
    },
    {
      name: 'lastSentAt',
      type: 'date',
      admin: {
        description: 'Last time OTP was sent (for rate limiting)',
      },
    },
    {
      name: 'requestIp',
      type: 'text',
      admin: {
        hidden: true,
        description: 'IP address of the request',
      },
    },
    {
      name: 'userAgent',
      type: 'text',
      admin: {
        hidden: true,
        description: 'User agent of the request',
      },
    },
  ],
  indexes: [
    {
      fields: ['phone'],
      unique: false, // Multiple verifications per phone allowed (different users)
    },
    {
      fields: ['phone', 'verifiedAt'],
    },
  ],
}

