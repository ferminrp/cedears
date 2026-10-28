import Link from "next/link"
import {
  formatEstimatedCedearUsd,
  formatFrequencyShort,
  formatShortDividendDate,
  formatUnderlyingYieldPercent,
} from "@/lib/dividend-display"
import { estimatedAnnualUsdPerCedear } from "@/lib/dividends-shared"
import type { UnderlyingDividends } from "@/lib/underlying-dividends"

function DetailRow({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/60 py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        {hint ? (
          <p className="text-xs text-muted-foreground/80">{hint}</p>
        ) : null}
      </div>
      <p className="shrink-0 font-mono text-sm tabular-nums text-foreground">
        {value}
      </p>
    </div>
  )
}

export function CedearDividendSummary({
  dividends,
  ratio,
  referenceDateIso,
}: {
  dividends: UnderlyingDividends
  ratio: string
  referenceDateIso: string
}) {
  const estimatedUsd = estimatedAnnualUsdPerCedear(dividends.rate, ratio)

  return (
    <div>
      <p className="text-sm text-muted-foreground">
        Yield y fechas del subyacente vía Yahoo Finance.{" "}
        <Link href="/dividendos" className="underline underline-offset-4">
          Ver calendario de dividendos
        </Link>
        .
      </p>
      <div className="mt-4">
        <DetailRow
          label="Yield (USD)"
          value={formatUnderlyingYieldPercent(dividends.yield)}
        />
        <DetailRow
          label="Frecuencia (estimada)"
          value={formatFrequencyShort(dividends.frequency)}
        />
        <DetailRow
          label="Próxima ex-date"
          value={formatShortDividendDate(dividends.exDate, referenceDateIso)}
        />
        <DetailRow
          label="Próximo pago"
          value={formatShortDividendDate(dividends.payDate, referenceDateIso)}
        />
        <DetailRow
          label="Cobro estimado (anual)"
          value={formatEstimatedCedearUsd(estimatedUsd)}
          hint={`Dividendo anual USD ÷ ratio ${ratio}`}
        />
      </div>
    </div>
  )
}
