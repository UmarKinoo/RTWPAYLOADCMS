import { withPayload } from '@payloadcms/next/withPayload'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

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
    // Enable image optimization and caching
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    // Note: quality is set per Image component (default is 75 in Next.js 13+)
    // We've set quality={75} in ImageMedia component
  },

  webpack: (config, { isServer }) => {
    // Exclude server-only modules from client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      }
    }
    return config
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
      {
        // Cache static assets (images) for 1 year
        source: '/assets/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

export default withPayload(withNextIntl(nextConfig))
