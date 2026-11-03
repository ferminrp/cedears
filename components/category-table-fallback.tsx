import { Skeleton } from "@/components/ui/skeleton"

const bone = "bg-foreground/10"

/**
 * Placeholder while category live prices load. Renders one bone per CEDEAR at
 * the real table's minimum row height so the sections below don't jump when
 * the table streams in.
 */
export function CategoryTableFallback({ rowCount }: { rowCount: number }) {
  return (
    <div
      className="flex flex-col gap-3"
      aria-busy="true"
      aria-live="polite"
      data-category-table-loading
    >
      <div className="flex flex-col gap-2 py-3 md:py-0">
        <Skeleton className={`h-11 w-full ${bone}`} />
        <Skeleton className={`h-5 w-40 ${bone}`} />
      </div>
      <div className="divide-y rounded-[var(--radius-m)] border border-border">
        <Skeleton className={`h-[60px] w-full rounded-none ${bone}`} />
        {Array.from({ length: Math.max(rowCount, 1) }, (_, index) => (
          <Skeleton
            key={index}
            className={`h-[50px] w-full rounded-none md:h-[45px] ${bone}`}
          />
        ))}
      </div>
      <span className="sr-only">Cargando tabla de CEDEARs…</span>
    </div>
  )
}
