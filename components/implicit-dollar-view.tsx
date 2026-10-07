import type { ImplicitDollarSummary } from "@/lib/implicit-dollar"
import { ImplicitDollarScatter } from "@/components/implicit-dollar-scatter"
import { ImplicitDollarTable } from "@/components/implicit-dollar-table"

const arsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export function ImplicitDollarView({
  title,
  description,
  summary,
}: {
  title: string
  description: string
  summary: ImplicitDollarSummary
}) {
  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-[var(--radius-m)] border border-border bg-card p-[var(--space-xl)] text-card-foreground">
        <p className="text-sm text-muted-foreground">{description}</p>
        <p className="mt-2 font-mono text-[length:var(--size-xxl)] leading-[var(--line-xxl)] font-semibold tracking-[var(--letter-spacing-xxl)] tabular-nums">
          {arsFormatter.format(summary.average)}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Promedio de {summary.count} CEDEARs
          {summary.outlierCount > 0
            ? ` (${summary.outlierCount} outlier${summary.outlierCount === 1 ? "" : "s"} excluido${summary.outlierCount === 1 ? "" : "s"})`
            : ""}
          .
        </p>
      </section>

      <section aria-labelledby="scatter-heading" className="rounded-[var(--radius-m)] border border-border bg-card p-[var(--space-l)] md:p-[var(--space-xl)] text-card-foreground">
        <h2 id="scatter-heading" className="mb-4 text-base font-medium">
          Dispersión
        </h2>
        <ImplicitDollarScatter rows={summary.scatterRows} average={summary.average} />
      </section>

      <section aria-labelledby="table-heading" className="flex flex-col gap-4">
        <h2 id="table-heading" className="text-base font-medium">
          {title}
        </h2>
        <ImplicitDollarTable rows={summary.rows} />
      </section>
    </div>
  )
}
