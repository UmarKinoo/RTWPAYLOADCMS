import type { CollectionConfig } from 'payload'
import type { User } from '@/payload-types'
import type { PayloadRequest } from 'payload'

import { hiddenFromBlogEditor } from '../access/hiddenFromBlogEditor'
import { allowOnlyAdmin } from '../access/allowOnlyAdmin'
import { sendInvitationForNewModerator } from './Users/hooks/sendInvitationForNewModerator'

/** Users who can access the Payload admin panel (admin = full access, blog-editor = blog-only) */
const canAccessAdmin = ({ req }: { req: PayloadRequest }): boolean => {
  const user = req.user as User | null
  return user?.role === 'admin' || user?.role === 'blog-editor'
}

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    hidden: hiddenFromBlogEditor,
    useAsTitle: 'email',
    components: {
      edit: {
        beforeDocumentControls: ['@/components/payload/SendInvitationButton#SendInvitationButton'],
      },
    },
  },
  auth: true,
  versions: false, // Disable versioning for users collection to avoid versioning errors
  access: {
    admin: canAccessAdmin,
    read: allowOnlyAdmin,
    create: allowOnlyAdmin,
    update: allowOnlyAdmin,
    delete: allowOnlyAdmin,
  },
  hooks: {
    afterChange: [sendInvitationForNewModerator],
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Blog Editor', value: 'blog-editor' },
        { label: 'Moderator', value: 'moderator' },
        { label: 'User', value: 'user' },
      ],
      required: true,
      defaultValue: 'user',
      admin: {
        description:
          'Admin: full Payload access. Blog Editor: can access Payload admin but only blog posts, categories, and media. Moderator: can approve/reject interview requests only (no Payload admin).',
      },
      saveToJWT: true, // Required for admin.hidden role checks in other collections
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
      name: 'invitationToken',
      type: 'text',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'invitationExpires',
      type: 'date',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'invitationSentAt',
      type: 'date',
      admin: {
        description: 'When the last invitation email was sent. Shown for reference.',
        readOnly: true,
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
