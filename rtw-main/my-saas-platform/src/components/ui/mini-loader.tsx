import { cn } from '@/lib/utils'

const SPINNER_CLASS = 'animate-spin rounded-full border-2 border-[#4644b8]/20 border-b-[#4644b8]'

interface MiniLoaderProps {
  /** Optional message below the spinner */
  message?: string
  /** Use full viewport height (e.g. for route loading). Default true when used in loading.tsx. */
  fullScreen?: boolean
  /** Spinner size: 'sm' (mini), 'md' (default), 'lg' */
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
}

/**
 * Mini loader used across the site (e.g. candidate registration, dashboard fallbacks).
 * Matches the site's purple (#4644b8) spinner style.
 */
export function MiniLoader({ message, fullScreen = true, size = 'md', className }: MiniLoaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center',
        fullScreen && 'min-h-[50vh]',
        className
      )}
      role="status"
      aria-label={message || 'Loading'}
    >
      <div className="text-center">
        <div
          className={cn(SPINNER_CLASS, sizeClasses[size], 'mx-auto', size === 'md' && 'mb-3', size === 'lg' && 'mb-4')}
        />
        {message && (
          <p className="text-sm text-[#16252d]">{message}</p>
        )}
      </div>
    </div>
  )
}
