import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'
import type { Post, Category, Media } from '@/payload-types'

// ============================================================================
// Types
// ============================================================================

export interface PostListItem {
  id: number
  title: string
  slug: string
  description: string | null
  imageUrl: string | null
  author: string | null
  publishedAt: string | null
  categories: { id: number; name: string }[]
}

export interface CategoryListItem {
  id: number
  name: string
}

// ============================================================================
// Helper Functions
// ============================================================================

function getMediaUrl(media: number | Media | null | undefined): string | null {
  if (!media) return null
  if (typeof media === 'number') return null
  return media.url || null
}

function formatAuthor(post: Post): string | null {
  if (post.populatedAuthors && post.populatedAuthors.length > 0) {
    return post.populatedAuthors[0]?.name || null
  }
  return null
}

function formatCategories(post: Post): { id: number; name: string }[] {
  if (!post.categories) return []
  return post.categories
    .map((cat) => {
      if (typeof cat === 'object' && cat !== null) {
        return { id: cat.id, name: cat.name }
      }
      return null
    })
    .filter((c): c is { id: number; name: string } => c !== null)
}

function toListItem(post: Post): PostListItem {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    description: post.meta?.description || null,
    imageUrl: getMediaUrl(post.heroImage) || getMediaUrl(post.meta?.image),
    author: formatAuthor(post),
    publishedAt: post.publishedAt || post.createdAt,
    categories: formatCategories(post),
  }
}

// ============================================================================
// Data Fetching Functions (Internal)
// ============================================================================

async function fetchPosts(options?: {
  limit?: number
  page?: number
  categoryId?: number
  search?: string
}): Promise<{
  posts: PostListItem[]
  totalDocs: number
  totalPages: number
  page: number
  hasNextPage: boolean
  hasPrevPage: boolean
}> {
  const payload = await getPayload({ config: configPromise })

  const { limit = 9, page = 1, categoryId, search } = options || {}

  // Build where clause
  const where: Record<string, unknown> = {
    _status: { equals: 'published' },
  }

  if (categoryId) {
    where.categories = { contains: categoryId }
  }

  if (search) {
    where.title = { contains: search }
  }

  const result = await payload.find({
    collection: 'posts',
    limit,
    page,
    sort: '-publishedAt',
    depth: 2, // Populate categories, authors, media
    where: where as any,
  })

  return {
    posts: result.docs.map(toListItem),
    totalDocs: result.totalDocs,
    totalPages: result.totalPages,
    page: result.page || 1,
    hasNextPage: result.hasNextPage,
    hasPrevPage: result.hasPrevPage,
  }
}

async function fetchCategories(): Promise<CategoryListItem[]> {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'categories',
    limit: 20,
    sort: 'name',
  })

  return result.docs.map((cat) => ({
    id: cat.id,
    name: cat.name,
  }))
}

async function fetchPostBySlug(slug: string): Promise<Post | null> {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'posts',
    where: {
      slug: { equals: slug },
      _status: { equals: 'published' },
    },
    limit: 1,
    depth: 2,
  })

  return result.docs[0] || null
}

// ============================================================================
// Cached Public API
// ============================================================================

/**
 * Get paginated list of posts (cached with 'posts' tag)
 */
export const getPosts = (options?: {
  limit?: number
  page?: number
  categoryId?: number
  search?: string
}) =>
  unstable_cache(
    async () => fetchPosts(options),
    [
      'posts',
      `page-${options?.page || 1}`,
      `limit-${options?.limit || 9}`,
      `cat-${options?.categoryId || 'all'}`,
      `search-${options?.search || ''}`,
    ],
    {
      tags: ['posts'],
      revalidate: 60,
    },
  )()

/**
 * Get all categories (cached with 'categories' tag)
 */
export const getCategories = () =>
  unstable_cache(async () => fetchCategories(), ['blog-categories'], {
    tags: ['categories'],
    revalidate: 3600, // 1 hour
  })()

/**
 * Get single post by slug (cached with 'post:${slug}' tag)
 */
export const getPostBySlug = (slug: string) =>
  unstable_cache(async () => fetchPostBySlug(slug), ['post', slug], {
    tags: [`post:${slug}`, 'posts'],
    revalidate: 60,
  })()

// ============================================================================
// Utility Functions
// ============================================================================

export function formatPostDate(dateString: string | null): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}



