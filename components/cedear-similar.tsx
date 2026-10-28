import Link from "next/link"
import type { Cedear } from "@/lib/cedears"
import { cedearCompanyLabel } from "@/lib/cedear-display"

type CedearSimilarProps = {
  items: Cedear[]
  categoryTag: string
}

export function CedearSimilar({ items, categoryTag }: CedearSimilarProps) {
  if (items.length === 0) return null

  return (
    <section
      aria-labelledby="similares-heading"
      className="rounded-[var(--radius-m)] border border-border bg-card p-6"
    >
      <h2
        id="similares-heading"
        className="text-[length:var(--size-l)] leading-[var(--line-l)] font-semibold tracking-[var(--letter-spacing-l)]"
      >
        CEDEARs similares
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Otros CEDEARs de {categoryTag}.
      </p>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {items.map((cedear) => (
          <li key={cedear.Cedears} className="min-w-0">
            <Link
              href={`/cedear/${cedear.Cedears}`}
              className="block min-w-0 rounded-[var(--radius-s)] border border-border px-3 py-2 text-sm transition-colors hover:bg-muted/60"
            >
              <span className="font-mono font-medium">{cedear.Cedears}</span>
              <span className="mt-0.5 block truncate text-muted-foreground">
                {cedearCompanyLabel(cedear)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
