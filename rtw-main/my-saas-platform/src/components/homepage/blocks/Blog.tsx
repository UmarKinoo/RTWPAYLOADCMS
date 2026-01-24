import React from 'react'
import { HomepageSection } from '../HomepageSection'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ImageWithSkeleton } from '../ImageWithSkeleton'
import { Link } from '@/i18n/routing'
import { getTranslations } from 'next-intl/server'
import { getPosts, formatPostDate } from '@/lib/payload/posts'

// Default image for posts without hero images
const DEFAULT_BLOG_IMAGE = '/assets/ac0fd8c628d0f50b3bdcbedaff88d237be9a96fe.webp'

interface BlogCardProps {
  image: string
  tags: string[]
  author: string
  date: string
  title: string
  description: string
  byLabel: string
  slug?: string
}

const BlogCard: React.FC<BlogCardProps> = ({ image, tags, author, date, title, description, byLabel, slug }) => {
  const cardContent = (
    <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow border-0 bg-white h-full cursor-pointer">
      {/* Image */}
      <div className="h-36 sm:h-40 md:h-44 lg:h-48 w-full overflow-hidden relative">
        <ImageWithSkeleton
          src={image}
          alt={title}
          fill
          objectFit="cover"
        />
      </div>

      {/* Content */}
      <CardContent className="p-4 sm:p-5 md:p-6 flex flex-col gap-3">
        {/* Tags */}
        <div className="flex gap-1.5 flex-wrap">
          {tags.map((tag, index) => (
            <Badge 
              key={index} 
              variant="outline" 
              className="text-[10px] sm:text-xs px-2 py-0.5 font-normal text-[#16252d] border-[#16252d]/30"
            >
              {tag}
            </Badge>
          ))}
        </div>

        {/* Author and Date */}
        <div className="flex items-center gap-2 text-[10px] sm:text-xs text-[#757575]">
          <span>{byLabel} {author}</span>
          <span>•</span>
          <span>{date}</span>
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg md:text-xl font-semibold font-inter text-[#16252d] leading-tight line-clamp-2">
          {title}
        </h3>

        {/* Description */}
        <p className="text-xs sm:text-sm md:text-base font-normal font-inter text-[#757575] leading-relaxed line-clamp-3">
          {description}
        </p>
      </CardContent>
    </Card>
  )

  if (slug) {
    return (
      <Link href={`/posts/${slug}`} className="block">
        {cardContent}
      </Link>
    )
  }

  return cardContent
}

export const Blog: React.FC = async () => {
  const t = await getTranslations('homepage.blog')
  
  // Fetch latest 3 blog posts from Payload CMS
  const { posts } = await getPosts({ limit: 3 })

  // Map Payload posts to BlogCard format
  const blogPosts = posts.map((post) => ({
    id: post.id,
    image: post.imageUrl || DEFAULT_BLOG_IMAGE,
    tags: post.categories.map((cat) => cat.name),
    author: post.author || 'Admin',
    date: formatPostDate(post.publishedAt),
    title: post.title,
    description: post.description || '',
    slug: post.slug,
  }))

  return (
    <HomepageSection className="pb-12 sm:pb-16 md:pb-20">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8 md:mb-10">
        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold font-inter text-[#16252d] mb-2 sm:mb-3 leading-tight">
          {t('title')}
        </h2>
        <p className="text-sm sm:text-base md:text-lg font-normal font-inter text-[#757575] max-w-2xl mx-auto">
          {t('subtitle')}
        </p>
      </div>

      {/* Blog Cards Grid */}
      {blogPosts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          {blogPosts.map((post) => (
            <BlogCard key={post.id} {...post} byLabel={t('by')} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-[#757575] font-inter">{t('noPosts') || 'No blog posts available yet.'}</p>
        </div>
      )}

      {/* View All Link */}
      <div className="flex justify-center mt-6 sm:mt-8">
        <Link 
          href="/blog" 
          className="text-sm sm:text-base font-semibold text-[#4644b8] hover:text-[#3a3aa0] underline underline-offset-4"
        >
          {t('viewAll')} <span className="inline-block rtl:rotate-180">→</span>
        </Link>
      </div>
    </HomepageSection>
  )
}
