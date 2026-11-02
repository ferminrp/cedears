import { Skeleton } from "@/components/ui/skeleton"

const bone = "bg-foreground/10"

export default function CategoryLoading() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-live="polite">
      <div className="flex flex-col gap-3">
        <Skeleton className={`h-4 w-48 max-w-full ${bone}`} />
        <Skeleton className={`h-10 w-full max-w-xl ${bone}`} />
        <Skeleton className={`h-4 w-56 max-w-full ${bone}`} />
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className={`h-6 w-64 max-w-full ${bone}`} />
        <Skeleton className={`h-10 w-full ${bone}`} />
        <div className="divide-y border-t border-border/60">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton
              key={index}
              className={`my-0 h-[52px] w-full rounded-none ${bone}`}
            />
          ))}
        </div>
      </div>
      <span className="sr-only">Cargando categoría…</span>
    </div>
  )
}
