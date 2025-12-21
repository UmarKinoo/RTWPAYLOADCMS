import { withPayload } from '@payloadcms/next/withPayload'

// Build remotePatterns from env (for R2 public hostname, etc.)
const remotePatterns = []
const r2PublicURL = process.env.R2_PUBLIC_URL
if (r2PublicURL && r2PublicURL.trim() !== '') {
  try {
    const parsed = new URL(r2PublicURL)
    remotePatterns.push({
      protocol: parsed.protocol.replace(':', ''), // e.g. https
      hostname: parsed.hostname, // e.g. pub-xxxx.r2.dev
    })
  } catch (err) {
    console.warn('Invalid R2_PUBLIC_URL, skipping image allowlist:', r2PublicURL)
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your Next.js config here
  output: 'standalone', // Required for Docker deployment

  images: {
    remotePatterns,
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
}

export default withPayload(nextConfig)
