import type { Metadata } from 'next'
import { HomepageNavbarWrapper } from '@/components/homepage/NavbarWrapper'
import { Newsletter } from '@/components/homepage/blocks/Newsletter'
import { Footer } from '@/components/homepage/blocks/Footer'
import { HomepageSection } from '@/components/homepage/HomepageSection'
import { BlogHero, BlogCard } from '@/components/blog'
import { getPosts, formatPostDate } from '@/lib/payload/posts'
import { BlogArchiveClient } from './BlogArchiveClient'

// ============================================================================
// Metadata
// ============================================================================

export const metadata: Metadata = {
  title: 'Blog | Ready to Work',
  description:
    'Stay updated with the latest trends in hiring, career success, and job market insights. Read our articles on skills, interviews, and professional development.',
}

// ============================================================================
// Page Component
// ============================================================================

export default async function BlogArchivePage() {
  // Fetch all published posts (using a high limit to get all posts)
  const { posts, totalDocs, totalPages, page } = await getPosts({
    limit: 1000, // High limit to fetch all posts
    page: 1,
  })

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <HomepageNavbarWrapper />
      <BlogHero />

      {/* Blog Content */}
      <HomepageSection className="py-12 sm:py-16 md:py-20">
        <BlogArchiveClient
          initialPosts={posts}
          initialTotalDocs={totalDocs}
          initialTotalPages={totalPages}
          initialPage={page}
        />
      </HomepageSection>

      <Newsletter />
      <Footer />
    </div>
  )
}






