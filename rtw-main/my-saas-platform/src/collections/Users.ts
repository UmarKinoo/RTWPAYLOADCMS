import type { CollectionConfig } from 'payload'
import type { User } from '@/payload-types'
import type { PayloadRequest } from 'payload'

const isAdmin = ({ req }: { req: PayloadRequest }): boolean => {
  const user = req.user as User | null
  return user?.role === 'admin'
}

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  versions: false, // Disable versioning for users collection to avoid versioning errors
  access: {
    admin: isAdmin,
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Moderator', value: 'moderator' },
        { label: 'User', value: 'user' },
      ],
      required: true,
      defaultValue: 'user',
      admin: {
        description: 'Admin: full Payload access. Moderator: can approve/reject interview requests only (no Payload admin).',
      },
    },
    {
      name: 'emailVerified',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Has the user verified their email address',
      },
    },
    {
      name: 'emailVerificationToken',
      type: 'text',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'emailVerificationExpires',
      type: 'date',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'passwordResetToken',
      type: 'text',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'passwordResetExpires',
      type: 'date',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'lastLoginAt',
      type: 'date',
      admin: {
        hidden: true,
        description: 'Deprecated for single-session; use sessionId + rtw-sid cookie instead.',
      },
    },
    {
      name: 'sessionId',
      type: 'text',
      admin: {
        hidden: true,
        description: 'Single session per account: DB.sessionId === cookie rtw-sid; rotate on login to log out other devices.',
      },
    },
    // If you want to add a username field, uncomment the following lines
    // {
    //   name: 'username',
    //   type: 'text',
    //   required: true,
    //   unique: true,
    // },
  ],
}
