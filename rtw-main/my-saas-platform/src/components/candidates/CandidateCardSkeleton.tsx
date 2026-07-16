import { cn } from '@/lib/utils'

/**
 * Pulsing placeholder matching the CandidateCard footprint (aspect + max widths),
 * shown while Smart Search results are loading.
 */
export function CandidateCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative w-full aspect-[341/530] max-w-[180px] sm:max-w-[200px] md:max-w-[220px] lg:max-w-[240px] xl:max-w-[280px] 2xl:max-w-[320px] mx-auto',
        className,
      )}
      role="status"
      aria-label="Loading candidate"
    >
      <div className="absolute inset-0 animate-pulse rounded-2xl border border-[#ececf4] bg-[#f4f4fa] p-[6%]">
        {/* Profile photo placeholder */}
        <div className="mx-auto mt-[18%] aspect-square w-[57%] rounded-full bg-[#e3e3ef]" />
        {/* Text line placeholders */}
        <div className="mt-[16%] flex flex-col items-center gap-[6%]">
          <div className="h-3 w-3/4 rounded-full bg-[#e3e3ef]" />
          <div className="h-2.5 w-1/2 rounded-full bg-[#e9e9f2]" />
          <div className="h-2 w-2/3 rounded-full bg-[#e9e9f2]" />
          <div className="h-2 w-1/2 rounded-full bg-[#e9e9f2]" />
        </div>
      </div>
    </div>
  )
}
