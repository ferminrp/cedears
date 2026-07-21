import {
  type Cedear,
  fairUsdPrice,
  formatArs,
  formatPct,
  formatUsd,
  implicitFxRate,
  pctClassName,
  premiumPct,
} from "@/lib/cedears"
import { Badge } from "@/components/ui/badge"

function DetailRow({
  label,
  value,
  valueClassName,
  hint,
}: {
  label: string
  value: string
  valueClassName?: string
  hint?: string
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/60 py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        {hint ? <p className="text-xs text-muted-foreground/80">{hint}</p> : null}
      </div>
      <p
        className={`shrink-0 font-mono text-sm tabular-nums ${valueClassName ?? "text-foreground"}`}
      >
        {value}
      </p>
    </div>
  )
}

export function CedearDetailView({ cedear }: { cedear: Cedear }) {
  const fairUsd = fairUsdPrice(cedear)
  const premMep = premiumPct(cedear.priceMep, fairUsd)
  const premCcl = premiumPct(cedear.priceCcl, fairUsd)
  const mepImplicit = implicitFxRate(cedear.price, cedear.priceMep)
  const cclImplicit = implicitFxRate(cedear.price, cedear.priceCcl)

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{cedear.Market}</Badge>
        <span className="text-xs text-muted-foreground">
          Ratio {cedear.Ratio}:1 · Subyacente {cedear.TickerOriginal}
        </span>
      </div>

      <section aria-labelledby="cedear-ars-heading" className="mt-4">
        <h3
          id="cedear-ars-heading"
          className="text-xs font-semibold tracking-wide text-foreground uppercase"
        >
          CEDEAR (ARS)
        </h3>
        <DetailRow label="Precio" value={formatArs(cedear.price)} />
        <DetailRow
          label="Var. %"
          value={formatPct(cedear.pctChange)}
          valueClassName={pctClassName(cedear.pctChange)}
        />
      </section>

      <section aria-labelledby="underlying-heading" className="mt-4">
        <h3
          id="underlying-heading"
          className="text-xs font-semibold tracking-wide text-foreground uppercase"
        >
          Subyacente (USD)
        </h3>
        <DetailRow
          label={`Precio ${cedear.TickerOriginal}`}
          value={formatUsd(cedear.usPrice)}
        />
        <DetailRow
          label="Teórico (precio / ratio)"
          value={formatUsd(fairUsd)}
          hint={`${cedear.TickerOriginal} ÷ ${cedear.Ratio}`}
        />
      </section>

      <section aria-labelledby="mep-heading" className="mt-4">
        <h3
          id="mep-heading"
          className="text-xs font-semibold tracking-wide text-foreground uppercase"
        >
          Dólar MEP ({cedear.Cedears}D)
        </h3>
        <DetailRow label="Cotización" value={formatUsd(cedear.priceMep)} />
        <DetailRow
          label="vs teórico"
          value={formatPct(premMep)}
          valueClassName={pctClassName(premMep)}
        />
        <DetailRow
          label="Cotización MEP implícita"
          value={formatArs(mepImplicit)}
        />
      </section>

      <section aria-labelledby="ccl-heading" className="mt-4">
        <h3
          id="ccl-heading"
          className="text-xs font-semibold tracking-wide text-foreground uppercase"
        >
          Dólar cable ({cedear.Cedears}C)
        </h3>
        <DetailRow label="Cotización" value={formatUsd(cedear.priceCcl)} />
        <DetailRow
          label="vs teórico"
          value={formatPct(premCcl)}
          valueClassName={pctClassName(premCcl)}
        />
        <DetailRow
          label="Cotización Cable implícita"
          value={formatArs(cclImplicit)}
        />
      </section>
    </div>
  )
}
