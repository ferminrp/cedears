import { Skeleton } from "@/components/ui/skeleton"

export default function SiteLoading() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-live="polite">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-64 max-w-full md:h-10" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="divide-y border-t border-border/60">
          {Array.from({ length: 8 }, (_, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-4 py-3"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-40 max-w-full" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>

      <span className="sr-only">Cargando sección…</span>
    </div>
  )
}
