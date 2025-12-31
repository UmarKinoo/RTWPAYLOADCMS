import React from 'react'
import { HomepageSection } from '../HomepageSection'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ImageWithSkeleton } from '../ImageWithSkeleton'
import Link from 'next/link'

// Image assets
const imgBlog1 = '/assets/ac0fd8c628d0f50b3bdcbedaff88d237be9a96fe.webp'
const imgBlog2 = '/assets/b567b848ec5f99df60fdd857ed8f6b1bd549a09f.webp'
const imgBlog3 = '/assets/66f1c9d350783934464a398f002f8006d6ca02f0.webp'

interface BlogCardProps {
  image: string
  tags: string[]
  author: string
  date: string
  title: string
  description: string
}

const BlogCard: React.FC<BlogCardProps> = ({ image, tags, author, date, title, description }) => {
  return (
    <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow border-0 bg-white">
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
          <span>By {author}</span>
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
}

export const Blog: React.FC = () => {
  const blogPosts = [
    {
      image: imgBlog1,
      tags: ['Job Market', 'Career'],
      author: 'Mona Amiri',
      date: '13 Mar 2025',
      title: 'When Should You Change Your Job?',
      description:
        'A professional resume increases your chances of getting hired. This article covers key tips like choosing the right format, highlighting skills, and writing concisely.',
    },
    {
      image: imgBlog2,
      tags: ['Freelancing', 'Skills'],
      author: 'Fateme Moradi',
      date: '16 Feb 2025',
      title: 'Standing Out in Job Market',
      description:
        'In a competitive job market, showcasing unique skills, tailoring your resume, and building a strong online presence can set you apart.',
    },
    {
      image: imgBlog3,
      tags: ['Career', 'Interview'],
      author: 'Ali Amiri',
      date: '12 May 2025',
      title: 'Skills Employers Seek',
      description:
        'Employers value a combination of technical expertise and soft skills. This article highlights key skills like communication and problem-solving.',
    },
  ]

  return (
    <HomepageSection className="pb-12 sm:pb-16 md:pb-20">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8 md:mb-10">
        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold font-inter text-[#16252d] mb-2 sm:mb-3 leading-tight">
          Our Blog: Your Path to Career Success
        </h2>
        <p className="text-sm sm:text-base md:text-lg font-normal font-inter text-[#757575] max-w-2xl mx-auto">
          Stay updated with the latest trends in hiring and career success
        </p>
      </div>

      {/* Blog Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
        {blogPosts.map((post, index) => (
          <BlogCard key={index} {...post} />
        ))}
      </div>

      {/* View All Link */}
      <div className="flex justify-center mt-6 sm:mt-8">
        <Link 
          href="/blog" 
          className="text-sm sm:text-base font-semibold text-[#4644b8] hover:text-[#3a3aa0] underline underline-offset-4"
        >
          View All Blog Posts →
        </Link>
      </div>
    </HomepageSection>
  )
}
