import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { s3Storage } from '@payloadcms/storage-s3'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'

import sharp from 'sharp'
import path from 'node:path'

import { Users } from '@/collections/Users'
import { Media } from '@/collections/Media'
import { Pages } from '@/collections/Pages'
import { Posts } from '@/collections/Posts'
import { Categories } from '@/collections/Categories'
import { Disciplines } from '@/collections/Disciplines'
import { SubCategories } from '@/collections/SubCategories'
import { Skills } from '@/collections/Skills'
import { Candidates } from '@/collections/Candidates'
import { Employers } from '@/collections/Employers'
import { Plans } from '@/collections/Plans'
import { Purchases } from '@/collections/Purchases'
import { Interviews } from '@/collections/Interviews'
import { Notifications } from '@/collections/Notifications'
import { CandidateInteractions } from '@/collections/CandidateInteractions'
import { JobPostings } from '@/collections/JobPostings'
import { Header } from '@/Header/config'
import { Footer } from '@/Footer/config'
import { plugins } from '@/plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from '@/utilities/getURL'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    components: {
      beforeLogin: ['@/components/BeforeLogin'],
      beforeDashboard: ['@/components/BeforeDashboard'],
    },
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  editor: defaultLexical,
  collections: [
    Pages,
    Posts,
    Media,
    Categories,
    Users,
    Disciplines,
    SubCategories,
    Skills,
    Candidates,
    Employers,
    Plans,
    Purchases,
    Interviews,
    Notifications,
    CandidateInteractions,
    JobPostings,
  ],
  cors: [getServerSideURL()].filter(Boolean),
  globals: [Header, Footer],
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  sharp,
  plugins: [
    ...plugins,
    payloadCloudPlugin(),
    // Cloudflare R2 Storage (S3-compatible)
    // Only enabled when R2 environment variables are present
    s3Storage({
      enabled: !!(
        process.env.R2_ACCOUNT_ID &&
        process.env.R2_ACCESS_KEY_ID &&
        process.env.R2_SECRET_ACCESS_KEY &&
        process.env.R2_BUCKET_NAME
      ),
      bucket: process.env.R2_BUCKET_NAME || '',
      collections: {
        media: {
          prefix: process.env.R2_PREFIX || 'media',
          // Always return the public R2 URL so Payload uses CDN/public path instead of local disk
          generateFileURL: ({ filename, prefix }) => {
            const base = process.env.R2_PUBLIC_URL || ''
            const withPrefix = prefix ? `${prefix}/${filename}` : filename
            // Ensure no trailing slash on base before appending
            return `${base.replace(/\/$/, '')}/${withPrefix}`
          },
        },
      },
      config: {
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
        },
        region: 'auto',
        endpoint: process.env.R2_ACCOUNT_ID
          ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
          : undefined,
        forcePathStyle: true,
      },
    }),
    // Supabase S3 Storage (for CV uploads and other file uploads)
    // Only enabled when S3 environment variables are present
    s3Storage({
      enabled: !!(
        process.env.S3_BUCKET &&
        process.env.S3_ACCESS_KEY_ID &&
        process.env.S3_SECRET_ACCESS_KEY &&
        process.env.S3_ENDPOINT
      ),
      bucket: process.env.S3_BUCKET || '',
      collections: {
        media: {
          prefix: 'uploads',
        },
      },
      config: {
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
        endpoint: process.env.S3_ENDPOINT || '',
        region: 'us-east-1', // Required for S3, but Supabase ignores this
        forcePathStyle: true, // Important for local Supabase S3 compatibility
      },
    }),
    // Vercel Blob Storage (fallback when R2 is not configured)
    // Disabled when R2 environment variables are present
    vercelBlobStorage({
      enabled: !!(
        !process.env.R2_ACCOUNT_ID &&
        !process.env.R2_ACCESS_KEY_ID &&
        !process.env.R2_SECRET_ACCESS_KEY &&
        !process.env.R2_BUCKET_NAME &&
        !process.env.S3_BUCKET &&
        process.env.BLOB_READ_WRITE_TOKEN
      ),
      collections: {
        media: true,
      },
      token: process.env.BLOB_READ_WRITE_TOKEN || '',
    }),
  ],
})
