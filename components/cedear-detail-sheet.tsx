"use client"

import {
  type Cedear,
  fairUsdPrice,
  premiumPct,
} from "@/lib/cedears"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

const arsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

const usdFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const pctFormatter = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
  signDisplay: "exceptZero",
})

function formatArs(value: number | null): string {
  if (value === null) return "—"
  return arsFormatter.format(value)
}

function formatUsd(value: number | null): string {
  if (value === null) return "—"
  return usdFormatter.format(value)
}

function formatPct(value: number | null): string {
  if (value === null) return "—"
  return `${pctFormatter.format(value)}%`
}

function pctClassName(value: number | null): string {
  if (value === null || value === 0) return "text-muted-foreground"
  if (value > 0) return "text-emerald-600 dark:text-emerald-400"
  return "text-red-600 dark:text-red-400"
}

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

export function CedearDetailSheet({
  cedear,
  open,
  onOpenChange,
}: {
  cedear: Cedear | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const fairUsd = cedear ? fairUsdPrice(cedear) : null
  const premMep = cedear ? premiumPct(cedear.priceMep, fairUsd) : null
  const premCcl = cedear ? premiumPct(cedear.priceCcl, fairUsd) : null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={
          isDesktop
            ? "w-full sm:max-w-md"
            : "max-h-[85vh] overflow-y-auto rounded-t-xl"
        }
      >
        {cedear ? (
          <>
            <SheetHeader className="border-b">
              <SheetTitle className="font-mono text-lg tracking-tight">
                {cedear.Cedears}
              </SheetTitle>
              <SheetDescription>{cedear.Name}</SheetDescription>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge variant="secondary">{cedear.Market}</Badge>
                <span className="text-xs text-muted-foreground">
                  Ratio {cedear.Ratio}:1 · Subyacente {cedear.TickerOriginal}
                </span>
              </div>
            </SheetHeader>

            <div className="px-4 pb-6">
              <section aria-labelledby="cedear-ars-heading">
                <h3
                  id="cedear-ars-heading"
                  className="pt-2 text-xs font-medium tracking-wide text-muted-foreground uppercase"
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
                  className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
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
                  className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
                >
                  Dólar MEP ({cedear.Cedears}D)
                </h3>
                <DetailRow
                  label="Cotización"
                  value={formatUsd(cedear.priceMep)}
                />
                <DetailRow
                  label="vs teórico"
                  value={formatPct(premMep)}
                  valueClassName={pctClassName(premMep)}
                />
              </section>

              <section aria-labelledby="ccl-heading" className="mt-4">
                <h3
                  id="ccl-heading"
                  className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
                >
                  Dólar cable ({cedear.Cedears}C)
                </h3>
                <DetailRow
                  label="Cotización"
                  value={formatUsd(cedear.priceCcl)}
                />
                <DetailRow
                  label="vs teórico"
                  value={formatPct(premCcl)}
                  valueClassName={pctClassName(premCcl)}
                />
              </section>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
