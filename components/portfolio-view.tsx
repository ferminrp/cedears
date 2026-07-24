"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { BriefcaseIcon, SearchIcon } from "lucide-react"
import {
  type Cedear,
  formatArs,
  formatPct,
  formatUsd,
  pctClassName,
} from "@/lib/cedears"
import { logoUrl } from "@/lib/logo"
import {
  computePortfolioComposition,
  computePortfolioSummary,
  prunePortfolioHoldings,
  readPortfolioHoldings,
  setHoldingQuantity,
  writePortfolioHoldings,
  type PortfolioHoldings,
} from "@/lib/portfolio"
import { formatPercent } from "@/lib/tools"
import { cn } from "@/lib/utils"
import { PortfolioDistribution } from "@/components/portfolio-distribution"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

const numericCellClassName = "text-right font-mono tabular-nums"
const empresaCellClassName = "max-w-52 text-muted-foreground"

function holdingsEqual(a: PortfolioHoldings, b: PortfolioHoldings): boolean {
  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)
  if (aKeys.length !== bKeys.length) return false
  return aKeys.every((key) => a[key] === b[key])
}

function formatFxFootnote(
  label: string,
  average: number,
  count: number,
  outlierCount: number,
): string {
  if (count === 0) return `${label}: datos no disponibles`

  const outlierSuffix =
    outlierCount > 0
      ? ` (${outlierCount} outlier${outlierCount === 1 ? "" : "s"} excluido${outlierCount === 1 ? "" : "s"})`
      : ""

  return `${label} ${formatArs(average)} (promedio de ${count} CEDEAR${count === 1 ? "" : "s"}${outlierSuffix})`
}

function holdingValueArs(cedear: Cedear, quantity: number): number | null {
  if (cedear.price === null) return null
  return quantity * cedear.price
}

function formatSignedMoney(
  value: number | null,
  format: (value: number | null) => string,
): string {
  if (value === null) return "—"
  const formatted = format(value)
  return value > 0 ? `+${formatted}` : formatted
}

function PortfolioValueChange({
  absolute,
  percent,
  formatAbsolute,
  showEmpty = false,
}: {
  absolute: number | null
  percent: number | null
  formatAbsolute: (value: number | null) => string
  showEmpty?: boolean
}) {
  if (absolute === null && percent === null) {
    if (!showEmpty) return null
    return (
      <p className="mt-1 font-mono text-xs tabular-nums text-muted-foreground">
        —
      </p>
    )
  }

  const tone = pctClassName(percent ?? absolute)

  return (
    <p className={cn("mt-1 font-mono text-xs tabular-nums", tone)}>
      {formatSignedMoney(absolute, formatAbsolute)}
      {percent !== null ? ` (${formatPct(percent)})` : ""}
    </p>
  )
}

export function PortfolioView({
  cedears,
  mepAverage,
  cableAverage,
  mepCount,
  mepOutlierCount,
  cableCount,
  cableOutlierCount,
}: {
  cedears: Cedear[]
  mepAverage: number
  cableAverage: number
  mepCount: number
  mepOutlierCount: number
  cableCount: number
  cableOutlierCount: number
}) {
  const [holdings, setHoldings] = useState<PortfolioHoldings>({})
  const [query, setQuery] = useState("")
  const [onlyHoldings, setOnlyHoldings] = useState(false)
  const holdingsHydratedRef = useRef(false)

  const tickerFingerprint = useMemo(
    () => cedears.map((c) => c.Cedears).sort().join("|"),
    [cedears],
  )

  const validTickers = useMemo(() => {
    if (!tickerFingerprint) return new Set<string>()
    return new Set(tickerFingerprint.split("|"))
  }, [tickerFingerprint])

  useEffect(() => {
    setHoldings((current) => {
      if (!holdingsHydratedRef.current) {
        holdingsHydratedRef.current = true
        return prunePortfolioHoldings(readPortfolioHoldings(), validTickers)
      }

      const pruned = prunePortfolioHoldings(current, validTickers)
      return holdingsEqual(current, pruned) ? current : pruned
    })
  }, [validTickers])

  useEffect(() => {
    if (!holdingsHydratedRef.current) return
    writePortfolioHoldings(holdings)
  }, [holdings])

  const summary = useMemo(
    () =>
      computePortfolioSummary(
        cedears,
        holdings,
        mepAverage,
        cableAverage,
      ),
    [cedears, holdings, mepAverage, cableAverage],
  )

  const composition = useMemo(
    () => computePortfolioComposition(cedears, holdings),
    [cedears, holdings],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()

    return cedears.filter((cedear) => {
      const quantity = holdings[cedear.Cedears] ?? 0
      if (onlyHoldings && quantity <= 0) return false

      if (q === "") return true

      return (
        cedear.Cedears.toLowerCase().includes(q) ||
        cedear.Name.toLowerCase().includes(q)
      )
    })
  }, [cedears, holdings, onlyHoldings, query])

  const displayed = useMemo(() => {
    const withHoldings: Cedear[] = []
    const withoutHoldings: Cedear[] = []

    for (const cedear of filtered) {
      const quantity = holdings[cedear.Cedears] ?? 0
      if (quantity > 0) withHoldings.push(cedear)
      else withoutHoldings.push(cedear)
    }

    withHoldings.sort((a, b) => {
      const valueA = holdingValueArs(a, holdings[a.Cedears] ?? 0) ?? 0
      const valueB = holdingValueArs(b, holdings[b.Cedears] ?? 0) ?? 0
      return valueB - valueA
    })

    withoutHoldings.sort((a, b) =>
      a.Cedears.localeCompare(b.Cedears, "es"),
    )

    return [...withHoldings, ...withoutHoldings]
  }, [filtered, holdings])

  function updateQuantity(ticker: string, rawValue: string) {
    if (rawValue === "") {
      setHoldings((current) => setHoldingQuantity(current, ticker, 0))
      return
    }

    const parsed = Number(rawValue)
    if (!Number.isFinite(parsed)) return

    setHoldings((current) => setHoldingQuantity(current, ticker, parsed))
  }

  const mepFootnote = formatFxFootnote(
    "MEP",
    mepAverage,
    mepCount,
    mepOutlierCount,
  )
  const cableFootnote = formatFxFootnote(
    "Cable",
    cableAverage,
    cableCount,
    cableOutlierCount,
  )

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Títulos</p>
            <p className="font-mono text-lg font-semibold tabular-nums">
              {summary.titulos}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Valor (ARS)</p>
            <p className="font-mono text-lg font-semibold tabular-nums">
              {formatArs(summary.valorArs)}
            </p>
            <PortfolioValueChange
              absolute={summary.variacionArs}
              percent={summary.variacionPct}
              formatAbsolute={formatArs}
              showEmpty={summary.titulos > 0}
            />
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Valor MEP (USD)</p>
            <p className="font-mono text-lg font-semibold tabular-nums">
              {formatUsd(summary.valorMep)}
            </p>
            <PortfolioValueChange
              absolute={summary.variacionMep}
              percent={summary.variacionPct}
              formatAbsolute={formatUsd}
              showEmpty={summary.titulos > 0}
            />
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Valor cable (USD)</p>
            <p className="font-mono text-lg font-semibold tabular-nums">
              {formatUsd(summary.valorCable)}
            </p>
            <PortfolioValueChange
              absolute={summary.variacionCable}
              percent={summary.variacionPct}
              formatAbsolute={formatUsd}
              showEmpty={summary.titulos > 0}
            />
          </div>
        </div>
        <PortfolioDistribution segments={composition} />
        <p className="text-xs text-muted-foreground">
          {mepFootnote} · {cableFootnote}
        </p>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por ticker o nombre..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            aria-label="Buscar en cartera"
          />
        </div>

        <Button
          type="button"
          variant={onlyHoldings ? "secondary" : "outline"}
          className="rounded-md text-sm"
          onClick={() => setOnlyHoldings((current) => !current)}
          aria-pressed={onlyHoldings}
        >
          {onlyHoldings ? "Mostrar todos" : "Solo en cartera"}
        </Button>
      </div>

      {displayed.length === 0 ? (
        <Empty className="rounded-lg border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              {onlyHoldings ? <BriefcaseIcon /> : <SearchIcon />}
            </EmptyMedia>
            <EmptyTitle>Sin resultados</EmptyTitle>
            <EmptyDescription>
              {onlyHoldings
                ? "No tenés posiciones en cartera que coincidan con tu búsqueda."
                : "No encontramos CEDEARs que coincidan con tu búsqueda."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table className="min-w-[54rem]">
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead className="min-w-24">Ticker</TableHead>
                <TableHead className="min-w-40">Empresa</TableHead>
                <TableHead className="min-w-24 text-right">Precio ARS</TableHead>
                <TableHead className="min-w-20 text-right">Var. %</TableHead>
                <TableHead className="min-w-28 text-right">Nominales</TableHead>
                <TableHead className="min-w-24 text-right">Valor ARS</TableHead>
                <TableHead className="min-w-16 text-right">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayed.map((cedear) => {
                const quantity = holdings[cedear.Cedears] ?? 0
                const valueArs = holdingValueArs(cedear, quantity)
                const portfolioPct =
                  quantity > 0 &&
                  valueArs !== null &&
                  summary.valorArs > 0
                    ? (valueArs / summary.valorArs) * 100
                    : null

                return (
                  <TableRow key={cedear.Cedears} className="bg-card hover:bg-muted/50">
                    <TableCell>
                      <span className="flex items-center gap-1.5">
                        <img
                          src={logoUrl(cedear.TickerOriginal)}
                          alt=""
                          width={16}
                          height={16}
                          className="size-4 shrink-0 rounded-sm bg-muted object-contain"
                          loading="lazy"
                        />
                        <span className="font-mono font-medium">
                          {cedear.Cedears}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className={empresaCellClassName}>
                      <span className="block truncate" title={cedear.Name}>
                        {cedear.Name}
                      </span>
                    </TableCell>
                    <TableCell className={numericCellClassName}>
                      {formatArs(cedear.price)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        numericCellClassName,
                        pctClassName(cedear.pctChange),
                      )}
                    >
                      {formatPct(cedear.pctChange)}
                    </TableCell>
                    <TableCell className={numericCellClassName}>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        step="any"
                        value={quantity > 0 ? quantity : ""}
                        onChange={(e) =>
                          updateQuantity(cedear.Cedears, e.target.value)
                        }
                        className="ml-auto w-24 text-right font-mono"
                        aria-label={`Nominales de ${cedear.Cedears}`}
                      />
                    </TableCell>
                    <TableCell
                      className={cn(
                        numericCellClassName,
                        quantity > 0 && valueArs === null
                          ? "text-muted-foreground"
                          : undefined,
                      )}
                    >
                      {quantity > 0 ? formatArs(valueArs) : "—"}
                    </TableCell>
                    <TableCell className={numericCellClassName}>
                      {formatPercent(portfolioPct)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
