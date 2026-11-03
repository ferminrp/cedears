import { Skeleton } from "@/components/ui/skeleton"

const bone = "bg-foreground/10"

/** Compact placeholder while category live prices load (not full-page). */
export function CategoryTableFallback() {
  return (
    <div
      className="flex flex-col gap-3"
      aria-busy="true"
      aria-live="polite"
      data-category-table-loading
    >
      <Skeleton className={`h-10 w-full ${bone}`} />
      <div className="divide-y border-t border-border/60">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton
            key={index}
            className={`my-0 h-[52px] w-full rounded-none ${bone}`}
          />
        ))}
      </div>
      <span className="sr-only">Cargando tabla de CEDEARs…</span>
    </div>
  )
}
