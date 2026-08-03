import { Link } from '@/i18n/routing'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

import { CANDIDATES_PER_PAGE } from '@/lib/candidates/profile-status'

export { CANDIDATES_PER_PAGE }

const PAGE_PARAM = 'page'
/** How many numbered page buttons to show in the pagination bar */
const VISIBLE_PAGE_NUMBERS = 5

type SearchParams = Record<string, string | undefined>

function buildCandidatesHref(searchParams: SearchParams, page: number): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(searchParams)) {
    if (!value || key === PAGE_PARAM) continue
    params.set(key, value)
  }
  if (page > 1) params.set(PAGE_PARAM, String(page))
  const qs = params.toString()
  return qs ? `/candidates?${qs}` : '/candidates'
}

function getVisiblePages(current: number, total: number, maxVisible: number): number[] {
  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const half = Math.floor(maxVisible / 2)
  let start = Math.max(1, current - half)
  let end = start + maxVisible - 1

  if (end > total) {
    end = total
    start = end - maxVisible + 1
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

export function CandidatesPagination(props: Readonly<{
  page: number
  totalPages: number
  searchParams: SearchParams
  locale: string
  previousLabel: string
  nextLabel: string
  className?: string
}>) {
  const { page, totalPages, searchParams, locale, previousLabel, nextLabel, className } = props
  if (totalPages <= 1) return null

  const hasPrevPage = page > 1
  const hasNextPage = page < totalPages
  const visiblePages = getVisiblePages(page, totalPages, VISIBLE_PAGE_NUMBERS)
  const showLeadingEllipsis = visiblePages[0] > 1
  const showTrailingEllipsis = visiblePages[visiblePages.length - 1] < totalPages

  const pageLinkClass = (active: boolean) =>
    cn(
      buttonVariants({ variant: active ? 'outline' : 'ghost', size: 'icon' }),
      'min-w-9 h-9',
    )

  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn('mx-auto flex w-full justify-center mt-8 sm:mt-10', className)}
    >
      <ul className="flex flex-row items-center gap-1">
        <li>
          {hasPrevPage ? (
            <Link
              href={buildCandidatesHref(searchParams, page - 1)}
              locale={locale}
              className={cn(buttonVariants({ variant: 'ghost', size: 'default' }), 'gap-1 px-2.5')}
              aria-label={previousLabel}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{previousLabel}</span>
            </Link>
          ) : (
            <span
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'default' }),
                'gap-1 px-2.5 pointer-events-none opacity-50',
              )}
              aria-disabled
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{previousLabel}</span>
            </span>
          )}
        </li>

        {showLeadingEllipsis && (
          <li>
            <span className="flex size-9 items-center justify-center">
              <MoreHorizontal className="size-4" />
              <span className="sr-only">More pages</span>
            </span>
          </li>
        )}

        {visiblePages.map((pageNum) => (
          <li key={pageNum}>
            <Link
              href={buildCandidatesHref(searchParams, pageNum)}
              locale={locale}
              aria-current={pageNum === page ? 'page' : undefined}
              className={pageLinkClass(pageNum === page)}
            >
              {pageNum}
            </Link>
          </li>
        ))}

        {showTrailingEllipsis && (
          <li>
            <span className="flex size-9 items-center justify-center">
              <MoreHorizontal className="size-4" />
              <span className="sr-only">More pages</span>
            </span>
          </li>
        )}

        <li>
          {hasNextPage ? (
            <Link
              href={buildCandidatesHref(searchParams, page + 1)}
              locale={locale}
              className={cn(buttonVariants({ variant: 'ghost', size: 'default' }), 'gap-1 px-2.5')}
              aria-label={nextLabel}
            >
              <span className="hidden sm:inline">{nextLabel}</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <span
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'default' }),
                'gap-1 px-2.5 pointer-events-none opacity-50',
              )}
              aria-disabled
            >
              <span className="hidden sm:inline">{nextLabel}</span>
              <ChevronRight className="h-4 w-4" />
            </span>
          )}
        </li>
      </ul>
    </nav>
  )
}
