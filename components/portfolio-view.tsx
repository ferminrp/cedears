"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { BriefcaseIcon, PlusIcon, SearchIcon } from "lucide-react"
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
  computePortfolioHoldingRows,
  computePortfolioSummary,
  prunePortfolioHoldings,
  readPortfolioHoldings,
  resolvePortfolioTicker,
  setHoldingQuantity,
  writePortfolioHoldings,
  type PortfolioHoldingRow,
  type PortfolioHoldings,
} from "@/lib/portfolio"
import { donutColor } from "@/lib/tools"
import { formatPercent } from "@/lib/tools"
import { cn } from "@/lib/utils"
import { PortfolioDistribution } from "@/components/portfolio-distribution"
import {
  PortfolioEditSheet,
  formatNominales,
  type PortfolioSheetRequest,
} from "@/components/portfolio-edit-sheet"
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
import { Skeleton } from "@/components/ui/skeleton"
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

/** `/portfolio?agregar=TICKER` opens the add/edit sheet (linked from the CEDEAR detail page). */
const DEEP_LINK_PARAM = "agregar"

function readDeepLinkParam(): string | null {
  try {
    return new URL(window.location.href).searchParams.get(DEEP_LINK_PARAM)
  } catch {
    return null
  }
}

/** Drop `?agregar=` so a refresh or back/forward doesn't reopen the sheet. */
function clearDeepLinkParam() {
  const url = new URL(window.location.href)
  if (!url.searchParams.has(DEEP_LINK_PARAM)) return
  url.searchParams.delete(DEEP_LINK_PARAM)
  window.history.replaceState(
    window.history.state,
    "",
    `${url.pathname}${url.search}${url.hash}`,
  )
}

/** Matches Tailwind's `md` breakpoint, where the full table replaces the sheet UI. */
const DESKTOP_QUERY = "(min-width: 48rem)"

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
  const [hydrated, setHydrated] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetRequest, setSheetRequest] = useState<PortfolioSheetRequest>({
    id: 0,
    ticker: null,
    query: "",
  })
  const deepLinkHandledRef = useRef(false)

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
    // Batched with the holdings above: the mobile list goes skeleton → real data in one render.
    setHydrated(true)
  }, [validTickers])

  useEffect(() => {
    if (!holdingsHydratedRef.current) return
    writePortfolioHoldings(holdings)
  }, [holdings])

  const returnFocusRef = useRef<HTMLElement | null>(null)

  const openSheet = useCallback((ticker: string | null, query = "") => {
    returnFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    setSheetRequest((current) => ({ id: current.id + 1, ticker, query }))
    setSheetOpen(true)
  }, [])

  const handleSheetOpenChange = useCallback((open: boolean) => {
    setSheetOpen(open)
    if (!open) clearDeepLinkParam()
  }, [])

  const saveFromSheet = useCallback(
    (ticker: string, quantity: number) => {
      setHoldings((current) => setHoldingQuantity(current, ticker, quantity))
      handleSheetOpenChange(false)
    },
    [handleSheetOpenChange],
  )

  const removeFromSheet = useCallback(
    (ticker: string) => {
      setHoldings((current) => setHoldingQuantity(current, ticker, 0))
      handleSheetOpenChange(false)
    },
    [handleSheetOpenChange],
  )

  // Deep link, once holdings are loaded so an existing position opens in edit mode.
  useEffect(() => {
    if (!hydrated || deepLinkHandledRef.current) return
    deepLinkHandledRef.current = true

    const raw = readDeepLinkParam()
    if (raw === null) return

    const ticker = resolvePortfolioTicker(raw, validTickers)

    if (window.matchMedia(DESKTOP_QUERY).matches) {
      // Desktop keeps the table: bring that row's input into view instead.
      clearDeepLinkParam()
      if (!ticker) return
      const input = document.querySelector<HTMLInputElement>(
        `input[aria-label="Nominales de ${CSS.escape(ticker)}"]`,
      )
      input?.scrollIntoView({ block: "center" })
      input?.focus({ preventScroll: true })
      return
    }

    // Unknown ticker: start from the search with what they asked for.
    openSheet(ticker, ticker ? "" : raw.trim())
  }, [hydrated, validTickers, openSheet])

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

  const holdingRows = useMemo(
    () => computePortfolioHoldingRows(cedears, holdings),
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
    <>
    <PortfolioMobile
      hydrated={hydrated}
      rows={holdingRows}
      composition={composition}
      summary={summary}
      mepAverage={mepAverage}
      cableAverage={cableAverage}
      onAdd={() => openSheet(null)}
      onEdit={(ticker) => openSheet(ticker)}
    />

    <PortfolioEditSheet
      open={sheetOpen}
      request={sheetRequest}
      onOpenChange={handleSheetOpenChange}
      cedears={cedears}
      holdings={holdings}
      mepAverage={mepAverage}
      onSave={saveFromSheet}
      onRemove={removeFromSheet}
      finalFocus={() => {
        // A removed holding's row is gone: land on "Agregar CEDEAR" instead of <body>.
        const previous = returnFocusRef.current
        if (previous?.isConnected && previous !== document.body) return previous
        return document.querySelector<HTMLElement>("[data-portfolio-add]")
      }}
    />

    {/* Desktop (md+): unchanged table. `hidden` = display:none on phones. */}
    <div className="hidden flex-col gap-4 md:flex">
      <section className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-[var(--radius-m)] border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Títulos</p>
            <p className="font-mono text-[length:var(--size-l)] leading-[var(--line-l)] font-semibold tabular-nums">
              {summary.titulos}
            </p>
          </div>
          <div className="rounded-[var(--radius-m)] border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Valor (ARS)</p>
            <p className="font-mono text-[length:var(--size-l)] leading-[var(--line-l)] font-semibold tabular-nums">
              {formatArs(summary.valorArs)}
            </p>
            <PortfolioValueChange
              absolute={summary.variacionArs}
              percent={summary.variacionPct}
              formatAbsolute={formatArs}
              showEmpty={summary.titulos > 0}
            />
          </div>
          <div className="rounded-[var(--radius-m)] border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Valor MEP (USD)</p>
            <p className="font-mono text-[length:var(--size-l)] leading-[var(--line-l)] font-semibold tabular-nums">
              {formatUsd(summary.valorMep)}
            </p>
            <PortfolioValueChange
              absolute={summary.variacionMep}
              percent={summary.variacionPct}
              formatAbsolute={formatUsd}
              showEmpty={summary.titulos > 0}
            />
          </div>
          <div className="rounded-[var(--radius-m)] border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Valor cable (USD)</p>
            <p className="font-mono text-[length:var(--size-l)] leading-[var(--line-l)] font-semibold tabular-nums">
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
        <Empty className="rounded-[var(--radius-m)] border border-border">
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
        <div className="overflow-hidden rounded-[var(--radius-m)] border border-border">
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
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Mobile (< md): summary, holdings only, add/edit via bottom sheet    */
/* ------------------------------------------------------------------ */

// The page shell stacks the h1 and this view without a gap, so the mobile view spaces itself.
const mobileRootClassName = "flex flex-col pt-[var(--space-l)] pb-[var(--space-xl)] md:hidden"

function PortfolioMobile({
  hydrated,
  rows,
  composition,
  summary,
  mepAverage,
  cableAverage,
  onAdd,
  onEdit,
}: {
  hydrated: boolean
  rows: PortfolioHoldingRow[]
  composition: ReturnType<typeof computePortfolioComposition>
  summary: ReturnType<typeof computePortfolioSummary>
  mepAverage: number
  cableAverage: number
  onAdd: () => void
  onEdit: (ticker: string) => void
}) {
  const addButton = (
    <Button
      type="button"
      data-portfolio-add=""
      onClick={onAdd}
      className="h-13 w-full rounded-[var(--radius-m)] text-[length:var(--size-m)] font-semibold"
    >
      <PlusIcon className="size-5" aria-hidden />
      Agregar CEDEAR
    </Button>
  )

  // Server render and first client render: storage isn't readable yet.
  if (!hydrated) {
    return (
      <div className={cn(mobileRootClassName, "gap-[var(--space-xl)]")} aria-busy="true">
        <span className="sr-only">Cargando tu portfolio…</span>
        <Skeleton className="h-36 rounded-[var(--radius-l)]" />
        <div className="flex flex-col gap-[var(--space-s)]">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className={cn(mobileRootClassName, "gap-[var(--space-l)]")}>
        <Empty className="border-border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BriefcaseIcon />
            </EmptyMedia>
            <EmptyTitle className="text-[length:var(--size-m)] leading-[var(--line-m)]">
              Todavía no cargaste CEDEARs
            </EmptyTitle>
            <EmptyDescription className="text-[length:var(--size-m)] leading-[var(--line-m)]">
              Agregá los que tenés y cuántos nominales: te mostramos cuánto vale tu
              portfolio en pesos y en dólares. Se guarda solo en este dispositivo.
            </EmptyDescription>
          </EmptyHeader>
          {addButton}
        </Empty>
      </div>
    )
  }

  const colorByTicker = new Map(
    composition.map((segment, index) => [segment.ticker, donutColor(index)]),
  )

  return (
    <div className={cn(mobileRootClassName, "gap-[var(--space-xl)]")}>
      <section
        aria-label="Resumen del portfolio"
        className="flex flex-col gap-[var(--space-l)] rounded-[var(--radius-l)] bg-muted p-[var(--space-l)]"
      >
        <div className="flex flex-col gap-[var(--space-xxs)]">
          <p className="text-[length:var(--size-m)] leading-[var(--line-m)] text-muted-foreground">
            Valor total
          </p>
          <p className="font-mono text-[length:var(--size-xl)] leading-[var(--line-xl)] font-medium tabular-nums">
            {formatArs(summary.valorArs)}
          </p>
          <PortfolioValueChange
            absolute={summary.variacionArs}
            percent={summary.variacionPct}
            formatAbsolute={formatArs}
          />
          <p className="mt-[var(--space-xs)] font-mono text-[length:var(--size-m)] leading-[var(--line-m)] tabular-nums text-muted-foreground">
            {summary.valorMep === null
              ? "MEP no disponible"
              : `${formatUsd(summary.valorMep)} al MEP de ${formatArs(mepAverage)}`}
          </p>
          <p className="font-mono text-[length:var(--size-s)] leading-[var(--line-s)] tabular-nums text-muted-foreground">
            {summary.valorCable === null
              ? "Cable no disponible"
              : `${formatUsd(summary.valorCable)} al cable de ${formatArs(cableAverage)}`}
          </p>
        </div>
        <PortfolioDistribution segments={composition} variant="inline" />
      </section>

      <section aria-labelledby="portfolio-holdings-title" className="flex flex-col">
        <div className="flex items-baseline justify-between gap-[var(--space-s)] pb-[var(--space-s)]">
          <h2
            id="portfolio-holdings-title"
            className="text-[length:var(--size-m)] leading-[var(--line-m)] font-semibold"
          >
            {rows.length} {rows.length === 1 ? "tenencia" : "tenencias"}
          </h2>
          <p className="text-[length:var(--size-s)] leading-[var(--line-s)] text-muted-foreground">
            Tocá una para editar
          </p>
        </div>
        <ul className="border-b border-border">
          {rows.map((row) => (
            <li key={row.ticker} className="border-t border-border">
              <button
                type="button"
                onClick={() => onEdit(row.ticker)}
                aria-label={`Editar ${row.ticker}: ${formatNominales(row.quantity)}, ${formatArs(row.valueArs)}${row.pct !== null ? `, ${formatPercent(row.pct)} del portfolio` : ""}`}
                className="-mx-[var(--space-s)] flex min-h-16 w-[calc(100%+2*var(--space-s))] items-center gap-[var(--space-m)] rounded-[var(--radius-s)] px-[var(--space-s)] py-[var(--space-s)] text-left transition-colors duration-[var(--motion-duration)] active:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--gui-color-1)]"
              >
                <span
                  aria-hidden
                  className="h-9 w-2.5 shrink-0 rounded-[var(--radius-xs)] bg-neutral-5"
                  style={
                    colorByTicker.has(row.ticker)
                      ? { backgroundColor: colorByTicker.get(row.ticker) }
                      : undefined
                  }
                />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-mono text-[length:var(--size-m)] leading-[var(--line-m)] font-medium">
                    {row.ticker}
                  </span>
                  <span className="truncate text-[length:var(--size-s)] leading-[var(--line-s)] text-muted-foreground">
                    {formatNominales(row.quantity)} · {formatArs(row.price)}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end font-mono tabular-nums">
                  <span className="text-[length:var(--size-m)] leading-[var(--line-m)] font-medium">
                    {formatArs(row.valueArs)}
                  </span>
                  <span className="text-[length:var(--size-s)] leading-[var(--line-s)] text-muted-foreground">
                    {formatPercent(row.pct)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-col gap-[var(--space-s)]">
        {addButton}
        <p className="text-center text-[length:var(--size-s)] leading-[var(--line-s)] text-muted-foreground">
          Se guarda solo en este dispositivo.
        </p>
      </div>
    </div>
  )
}
