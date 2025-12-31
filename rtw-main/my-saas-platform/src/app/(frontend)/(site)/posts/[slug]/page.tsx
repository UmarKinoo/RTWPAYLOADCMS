import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { draftMode } from 'next/headers'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'

import { HomepageNavbar } from '@/components/homepage/Navbar'
import { Newsletter } from '@/components/homepage/blocks/Newsletter'
import { Footer } from '@/components/homepage/blocks/Footer'
import { HomepageSection } from '@/components/homepage/HomepageSection'
import { ImageWithSkeleton } from '@/components/homepage/ImageWithSkeleton'
import RichText from '@/components/RichText'
import { generateMeta } from '@/utilities/generateMeta'
import { LivePreviewListener } from '@/components/LivePreviewListener'

import type { Post, Media } from '@/payload-types'

// ============================================================================
// Types
// ============================================================================

type Args = {
  params: Promise<{
    slug: string
  }>
}

// ============================================================================
// Data Fetching
// ============================================================================

const queryPostBySlug = cache(async (slug: string) => {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'posts',
    draft,
    limit: 1,
    depth: 2,
    overrideAccess: draft,
    where: {
      slug: { equals: slug },
    },
  })

  return result.docs?.[0] || null
})

// ============================================================================
// Static Params
// ============================================================================

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const posts = await payload.find({
    collection: 'posts',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    where: {
      _status: { equals: 'published' },
    },
    select: {
      slug: true,
    },
  })

  return posts.docs?.map(({ slug }) => ({ slug })) || []
}

// ============================================================================
// Metadata
// ============================================================================

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug } = await paramsPromise
  const post = await queryPostBySlug(slug)

  if (!post) {
    return {
      title: 'Post Not Found | Ready to Work',
      description: 'The requested blog post could not be found.',
    }
  }

  return generateMeta({ doc: post })
}

// ============================================================================
// Helper Functions
// ============================================================================

function getMediaUrl(media: number | Media | null | undefined): string | null {
  if (!media) return null
  if (typeof media === 'number') return null
  return media.url || null
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function getAuthorName(post: Post): string | null {
  if (post.populatedAuthors && post.populatedAuthors.length > 0) {
    return post.populatedAuthors[0]?.name || null
  }
  return null
}

function getCategories(post: Post): string[] {
  if (!post.categories) return []
  return post.categories
    .map((cat) => (typeof cat === 'object' ? cat.name : null))
    .filter((name): name is string => name !== null)
}

// ============================================================================
// Page Component
// ============================================================================

const DEFAULT_IMAGE = '/assets/ac0fd8c628d0f50b3bdcbedaff88d237be9a96fe.webp'

export default async function PostPage({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { slug } = await paramsPromise

  const post = await queryPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const heroImage = getMediaUrl(post.heroImage) || getMediaUrl(post.meta?.image) || DEFAULT_IMAGE
  const authorName = getAuthorName(post)
  const categories = getCategories(post)
  const publishedDate = formatDate(post.publishedAt || post.createdAt)

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <HomepageNavbar />

      {/* Hero Section */}
      <section className="relative w-full h-[40vh] min-h-[300px] max-h-[500px] overflow-hidden">
        <div className="absolute inset-0">
          <ImageWithSkeleton
            src={heroImage}
            alt={post.title}
            fill
            objectFit="cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 md:p-12 lg:p-16">
          <HomepageSection>
            {/* Categories */}
            {categories.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-4">
                {categories.map((cat, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-[#4644b8] text-white text-[12px] sm:text-[14px] font-medium rounded-full"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )}

            <h1 className="font-inter font-bold text-white text-[28px] sm:text-[36px] md:text-[44px] lg:text-[52px] leading-tight max-w-4xl">
              {post.title}
            </h1>

            {/* Meta info */}
            <div className="flex items-center gap-3 mt-4 text-white/80 text-[14px] sm:text-[16px]">
              {authorName && (
                <>
                  <span>By {authorName}</span>
                  <span>•</span>
                </>
              )}
              <span>{publishedDate}</span>
            </div>
          </HomepageSection>
        </div>
      </section>

      {/* Content Section */}
      <HomepageSection className="py-12 sm:py-16 md:py-20">
        {draft && <LivePreviewListener />}

        <article className="max-w-3xl mx-auto">
          {post.content && (
            <RichText
              className="prose prose-lg md:prose-xl max-w-none prose-headings:text-[#16252d] prose-p:text-[#4a4a4a] prose-a:text-[#4644b8]"
              data={post.content}
              enableGutter={false}
            />
          )}
        </article>

        {/* Related Posts */}
        {post.relatedPosts && post.relatedPosts.length > 0 && (
          <div className="mt-16 pt-12 border-t border-gray-200">
            <h2 className="font-inter font-bold text-[#16252d] text-[24px] sm:text-[28px] md:text-[32px] mb-8">
              Related Posts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {post.relatedPosts.slice(0, 3).map((relatedPost) => {
                if (typeof relatedPost === 'number') return null
                return (
                  <a
                    key={relatedPost.id}
                    href={`/posts/${relatedPost.slug}`}
                    className="block group"
                  >
                    <div className="relative h-48 rounded-lg overflow-hidden mb-4">
                      <ImageWithSkeleton
                        src={getMediaUrl(relatedPost.heroImage) || DEFAULT_IMAGE}
                        alt={relatedPost.title}
                        fill
                        objectFit="cover"
                        className="group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <h3 className="font-inter font-semibold text-[#4644b8] text-[18px] sm:text-[20px] group-hover:underline">
                      {relatedPost.title}
                    </h3>
                  </a>
                )
              })}
            </div>
          </div>
        )}
      </HomepageSection>

      <Newsletter />
      <Footer />
    </div>
  )
}



