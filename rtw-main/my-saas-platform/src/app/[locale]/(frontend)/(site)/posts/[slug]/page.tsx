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
import { getServerSideURL } from '@/utilities/getURL'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

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
      metadataBase: new URL(getServerSideURL()),
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

  // Fetch latest posts for "Latest posts" section
  const payload = await getPayload({ config: configPromise })
  const latestPostsResult = await payload.find({
    collection: 'posts',
    limit: 3,
    sort: '-publishedAt',
    depth: 2,
    where: {
      _status: { equals: 'published' },
      id: { not_equals: post.id },
    },
  })
  const latestPosts = latestPostsResult.docs || []

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <HomepageNavbar />

      {/* Full-Width Hero Image */}
      <section className="relative w-full h-[50vh] min-h-[400px] max-h-[600px] overflow-hidden">
        <div className="absolute inset-0">
          <ImageWithSkeleton
            src={heroImage}
            alt={post.title}
            fill
            objectFit="cover"
            priority
            className="object-center"
          />
        </div>
      </section>

      {/* Title and Metadata Section - Centered */}
      <HomepageSection className="py-10 sm:py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            {/* Categories */}
            {categories.length > 0 && (
              <div className="flex items-center justify-center gap-2 flex-wrap mb-4">
                {categories.map((cat, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="text-[12px] font-medium text-[#4a4a4a] border-[#EDEDED] hover:border-[#4644b8] hover:text-[#4644b8] transition-colors"
                  >
                    {cat}
                  </Badge>
                ))}
              </div>
            )}

            <h1 className="font-inter font-bold text-[#4644b8] text-[32px] sm:text-[40px] md:text-[48px] lg:text-[56px] leading-[1.1] mb-6 sm:mb-8">
              {post.title}
            </h1>

            {/* Meta info */}
            <div className="flex items-center justify-center gap-3 text-[#4a4a4a] text-[14px] sm:text-[15px] font-medium">
              {authorName && (
                <>
                  <span className="text-[#16252d]">Written by {authorName}</span>
                  <Separator orientation="vertical" className="h-4 bg-[#CBCBCB]" />
                </>
              )}
              <span>{publishedDate}</span>
            </div>
          </div>

          <Separator className="bg-[#EDEDED] mt-8" />
        </div>
      </HomepageSection>

      {/* Content Section */}
      <HomepageSection className="pt-4 sm:pt-5 md:pt-6 pb-10 sm:pb-12 md:pb-16">
        {draft && <LivePreviewListener />}

        <article className="max-w-3xl mx-auto font-inter">
          {post.content && (
            <RichText
              className="max-w-none font-inter text-[#4a4a4a]
                [&_h1]:text-[32px] [&_h1]:font-semibold [&_h1]:text-[#16252d] [&_h1]:leading-[1.2] [&_h1]:mb-6 [&_h1]:mt-10 [&_h1]:first:mt-0 [&_h1]:tracking-tight
                [&_h2]:text-[28px] [&_h2]:font-semibold [&_h2]:text-[#16252d] [&_h2]:leading-[1.3] [&_h2]:mb-5 [&_h2]:mt-10 [&_h2]:first:mt-0 [&_h2]:tracking-tight
                [&_h3]:text-[24px] [&_h3]:font-semibold [&_h3]:text-[#16252d] [&_h3]:leading-[1.3] [&_h3]:mb-4 [&_h3]:mt-8 [&_h3]:first:mt-0 [&_h3]:tracking-tight
                [&_h4]:text-[20px] [&_h4]:font-semibold [&_h4]:text-[#16252d] [&_h4]:leading-[1.4] [&_h4]:mb-4 [&_h4]:mt-8 [&_h4]:first:mt-0
                [&_h5]:text-[18px] [&_h5]:font-semibold [&_h5]:text-[#16252d] [&_h5]:leading-[1.4] [&_h5]:mb-3 [&_h5]:mt-6 [&_h5]:first:mt-0
                [&_h6]:text-[16px] [&_h6]:font-semibold [&_h6]:text-[#16252d] [&_h6]:leading-[1.4] [&_h6]:mb-3 [&_h6]:mt-6 [&_h6]:first:mt-0
                [&_p]:text-[16px] [&_p]:font-normal [&_p]:text-[#4a4a4a] [&_p]:leading-[1.7] [&_p]:mb-6 [&_p]:text-pretty [&_p:first-child]:mt-0
                [&_strong]:font-semibold [&_strong]:text-[#16252d]
                [&_em]:italic [&_em]:text-[#4a4a4a]
                [&_a]:text-[#4644b8] [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-2 [&_a]:decoration-[#4644b8]/30 [&_a]:hover:text-[#4644b8]/80 [&_a]:hover:decoration-[#4644b8]/60 [&_a]:transition-all
                [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-6 [&_ul]:space-y-3 [&_ul]:marker:text-[#4644b8]
                [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-6 [&_ol]:space-y-3 [&_ol]:marker:font-semibold [&_ol]:marker:text-[#4644b8]
                [&_li]:text-[16px] [&_li]:font-normal [&_li]:text-[#4a4a4a] [&_li]:leading-[1.7] [&_li]:pl-2
                [&_li_p]:mb-3 [&_li_p]:mt-0
                [&_blockquote]:border-l-4 [&_blockquote]:border-[#4644b8] [&_blockquote]:pl-6 [&_blockquote]:pr-4 [&_blockquote]:py-4 [&_blockquote]:my-8 [&_blockquote]:bg-[#E5EAE8]/30 [&_blockquote]:rounded-r-lg [&_blockquote]:text-[#4a4a4a] [&_blockquote]:italic [&_blockquote]:text-[16px] [&_blockquote]:leading-[1.7]
                [&_blockquote_p]:mb-0 [&_blockquote_p]:last:mb-0
                [&_hr]:my-10 [&_hr]:border-t-2 [&_hr]:border-[#EDEDED]
                [&_code]:bg-[#EDEDED] [&_code]:px-2 [&_code]:py-1 [&_code]:rounded-md [&_code]:text-[14px] [&_code]:font-mono [&_code]:text-[#16252d] [&_code]:font-medium [&_code]:border [&_code]:border-[#CBCBCB]
                [&_pre]:bg-[#16252d] [&_pre]:text-white [&_pre]:p-6 [&_pre]:rounded-lg [&_pre]:my-8 [&_pre]:overflow-x-auto [&_pre]:border [&_pre]:border-[#CBCBCB]
                [&_pre_code]:bg-transparent [&_pre_code]:text-white [&_pre_code]:border-0 [&_pre_code]:p-0
                [&_img]:rounded-lg [&_img]:my-8 [&_img]:shadow-md [&_img]:border [&_img]:border-[#EDEDED]
                [&_table]:w-full [&_table]:my-8 [&_table]:border-collapse [&_table]:border [&_table]:border-[#EDEDED] [&_table]:rounded-lg [&_table]:overflow-hidden
                [&_th]:bg-[#E5EAE8] [&_th]:px-4 [&_th]:py-3 [&_th]:text-left [&_th]:font-semibold [&_th]:text-[#16252d] [&_th]:border-b [&_th]:border-[#EDEDED]
                [&_td]:px-4 [&_td]:py-3 [&_td]:border-b [&_td]:border-[#EDEDED] [&_td]:text-[#4a4a4a]
                [&_tr:last-child_td]:border-b-0"
              data={post.content}
              enableGutter={false}
              enableProse={false}
            />
          )}
        </article>
      </HomepageSection>

      {/* Latest Posts Section */}
      {latestPosts.length > 0 && (
        <HomepageSection className="py-12 sm:py-16 md:py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-inter font-bold text-[#16252d] text-[28px] sm:text-[32px] md:text-[36px] lg:text-[40px] mb-8 sm:mb-12">
              Latest posts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {latestPosts.map((latestPost) => {
                const latestPostImage = getMediaUrl(latestPost.heroImage) || DEFAULT_IMAGE
                const latestPostAuthor = latestPost.populatedAuthors?.[0]?.name || 'Unknown'
                const latestPostDate = formatDate(latestPost.publishedAt || latestPost.createdAt)
                const latestPostCategories = latestPost.categories
                  ?.map((cat) => (typeof cat === 'object' ? cat.name : null))
                  .filter((name): name is string => name !== null) || []

                return (
                  <a
                    key={latestPost.id}
                    href={`/posts/${latestPost.slug}`}
                    className="block group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Thumbnail */}
                    <div className="relative h-48 sm:h-56 overflow-hidden">
                      <ImageWithSkeleton
                        src={latestPostImage}
                        alt={latestPost.title}
                        fill
                        objectFit="cover"
                        className="group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Content */}
                    <div className="p-4 sm:p-6">
                      {/* Categories */}
                      {latestPostCategories.length > 0 && (
                        <div className="flex gap-2 flex-wrap mb-3">
                          {latestPostCategories.slice(0, 2).map((cat, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-[11px] sm:text-[12px] font-medium text-[#4a4a4a] border-[#EDEDED] hover:border-[#4644b8] hover:text-[#4644b8] transition-colors"
                            >
                              {cat}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Author and Date */}
                      <div className="text-[#4a4a4a] text-[12px] sm:text-[13px] mb-3">
                        <span>{latestPostAuthor}</span>
                        <span className="mx-2">•</span>
                        <span>{latestPostDate}</span>
                      </div>

                      {/* Title */}
                      <h3 className="font-inter font-semibold text-[#16252d] text-[16px] sm:text-[18px] md:text-[20px] mb-2 group-hover:text-[#4644b8] transition-colors line-clamp-2">
                        {latestPost.title}
                      </h3>

                      {/* Description/Excerpt */}
                      {latestPost.meta?.description && (
                        <p className="text-[#4a4a4a] text-[14px] sm:text-[15px] leading-relaxed line-clamp-3">
                          {latestPost.meta.description}
                        </p>
                      )}
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        </HomepageSection>
      )}

      <Newsletter />
      <Footer />
    </div>
  )
}






