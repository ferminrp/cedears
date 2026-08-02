import { Skeleton } from "@/components/ui/skeleton"

/** Visible against stone background (muted === background in this theme). */
const bone = "bg-foreground/10"

export function SiteLoading() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-live="polite">
      <div className="flex flex-col gap-3">
        <Skeleton className={`h-9 w-64 max-w-full md:h-10 ${bone}`} />
        <Skeleton className={`h-4 w-80 max-w-full ${bone}`} />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <Skeleton className={`h-8 w-40 ${bone}`} />
          <Skeleton className={`h-8 w-28 ${bone}`} />
          <Skeleton className={`h-8 w-24 ${bone}`} />
        </div>
        <div className="divide-y border-t border-border/60">
          {Array.from({ length: 8 }, (_, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-4 py-3"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className={`h-4 w-16 ${bone}`} />
                <Skeleton className={`h-3 w-40 max-w-full ${bone}`} />
              </div>
              <Skeleton className={`h-4 w-20 ${bone}`} />
            </div>
          ))}
        </div>
      </div>

      <span className="sr-only">Cargando sección…</span>
    </div>
  )
}
