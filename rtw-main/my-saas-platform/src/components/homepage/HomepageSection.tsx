import React from 'react'
import { cn } from '@/lib/utils'

interface HomepageSectionProps {
  children: React.ReactNode
  className?: string
  background?: string
}

/**
 * HomepageSection - Wrapper component for homepage blocks with consistent padding
 */
export const HomepageSection: React.FC<HomepageSectionProps> = ({
  children,
  className = '',
  background,
}) => {
  return (
    <section
      className={cn('w-full overflow-x-hidden', className)}
      style={background ? { background } : undefined}
    >
      <div className="px-4 sm:px-6 md:px-8 lg:px-12 2xl:px-[95px]">
        {children}
      </div>
    </section>
  )
}
