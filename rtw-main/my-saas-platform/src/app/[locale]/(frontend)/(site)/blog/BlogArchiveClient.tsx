'use client'

import React, { useState, useMemo } from 'react'
import { BlogCard, BlogFilters, BlogPagination } from '@/components/blog'
import type { PostListItem } from '@/lib/payload/posts'

// ============================================================================
// Props
// ============================================================================

interface BlogArchiveClientProps {
  initialPosts: PostListItem[]
  initialTotalDocs: number
  initialTotalPages: number
  initialPage: number
}

// ============================================================================
// Helper
// ============================================================================

function formatPostDate(dateString: string | null): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ============================================================================
// Component
// ============================================================================

export const BlogArchiveClient: React.FC<BlogArchiveClientProps> = ({
  initialPosts,
  initialTotalDocs,
  initialTotalPages,
  initialPage,
}) => {
  const [searchValue, setSearchValue] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(initialPage)

  // For now, client-side filtering (can be enhanced to server-side)
  const filteredPosts = useMemo(() => {
    let result = [...initialPosts]

    // Filter by search
    if (searchValue.trim()) {
      const searchLower = searchValue.toLowerCase()
      result = result.filter(
        (post) =>
          post.title.toLowerCase().includes(searchLower) ||
          post.description?.toLowerCase().includes(searchLower),
      )
    }

    // Filter by categories (if any selected)
    if (selectedCategories.length > 0) {
      result = result.filter((post) =>
        post.categories.some((cat) =>
          selectedCategories.some(
            (selected) =>
              cat.name.toLowerCase().includes(selected.replace('-', ' ').toLowerCase()),
          ),
        ),
      )
    }

    return result
  }, [initialPosts, searchValue, selectedCategories])

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((c) => c !== categoryId)
        : [...prev, categoryId],
    )
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // In a full implementation, this would fetch new data from the server
    window.scrollTo({ top: 400, behavior: 'smooth' })
  }

  // Pagination (client-side for now)
  const postsPerPage = 9
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage,
  )
  const calculatedTotalPages = Math.ceil(filteredPosts.length / postsPerPage)

  return (
    <>
      {/* Filters */}
      <BlogFilters
        searchValue={searchValue}
        onSearchChange={(val) => {
          setSearchValue(val)
          setCurrentPage(1) // Reset to first page on search
        }}
        selectedCategories={selectedCategories}
        onCategoryToggle={handleCategoryToggle}
      />

      {/* Blog Grid */}
      <div className="mt-10 sm:mt-12 md:mt-16">
        {paginatedPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {paginatedPosts.map((post) => (
              <BlogCard
                key={post.id}
                slug={post.slug}
                image={post.imageUrl}
                tags={post.categories}
                author={post.author}
                date={formatPostDate(post.publishedAt)}
                title={post.title}
                description={post.description}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-[20px] sm:text-[24px] font-semibold text-[#16252d] mb-2">
              No posts found
            </p>
            <p className="text-[14px] sm:text-[16px] text-[#757575]">
              Try adjusting your search or filters.
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {calculatedTotalPages > 1 && (
        <div className="mt-12 sm:mt-16">
          <BlogPagination
            currentPage={currentPage}
            totalPages={calculatedTotalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </>
  )
}






