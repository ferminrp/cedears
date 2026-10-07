"use client"

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronDownIcon,
  EqualIcon,
  FolderDownIcon,
  FileDownIcon,
  FileUpIcon,
  LandmarkIcon,
  ScaleIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"

import { BOND_QUOTE_BASIS, type Bond } from "@/lib/bonds"
import { type Cedear, formatArs } from "@/lib/cedears"
import { logoUrl } from "@/lib/logo"
import { readPortfolioHoldings } from "@/lib/portfolio"
import {
  computeAccumulation,
  computeRebalance,
  donutColor,
  formatPercent,
  parsePortfolioCsv,
  partitionPortfolioEntries,
  portfolioToCsv,
  readRebalanceState,
  writeRebalanceState,
  nextColorIndex,
  withColorIndexes,
  type RebalanceEntry,
  type RebalanceInput,
  type RebalanceMode,
} from "@/lib/tools"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { CedearPicker } from "@/components/cedear-picker"
import { PortfolioDonut, type DonutSegment } from "@/components/portfolio-donut"
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

type Asset = {
  ticker: string
  name: string
  logoTicker: string | null
  unitPrice: number | null
  isBond: boolean
}

const MODES: { value: RebalanceMode; label: string; description: string }[] = [
  {
    value: "rebalance",
    label: "Compra y venta",
    description: "Vendé lo que sobra y comprá lo que falta, sin aportar dinero.",
  },
  {
    value: "accumulate",
    label: "Solo compra (acumulación)",
    description:
      "Invertí dinero nuevo en lo que está por debajo del objetivo, sin vender.",
  },
]

const numericCell = "text-right font-mono tabular-nums"

function ColorDot({ color }: { color: string | undefined }) {
  return (
    <span
      aria-hidden
      className="size-2.5 shrink-0 rounded-full"
      style={{ backgroundColor: color }}
    />
  )
}

export function RebalanceCalculator({
  cedears,
  bonds = [],
}: {
  cedears: Cedear[]
  bonds?: Bond[]
}) {
  const [rows, setRows] = useState<RebalanceEntry[]>([])
  const [mode, setMode] = useState<RebalanceMode>("rebalance")
  const [contribution, setContribution] = useState<number>(100000)
  const [restored, setRestored] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const saved = readRebalanceState()
    if (saved) {
      setRows(saved.rows)
      setMode(saved.mode)
      setContribution(saved.contribution)
    }
    setRestored(true)
  }, [])

  useEffect(() => {
    if (!restored) return
    writeRebalanceState({ rows, mode, contribution })
  }, [restored, rows, mode, contribution])

  const assetByTicker = useMemo(() => {
    const assets = new Map<string, Asset>()
    for (const b of bonds) {
      assets.set(b.symbol, {
        ticker: b.symbol,
        name: b.name,
        logoTicker: null,
        unitPrice: b.price / BOND_QUOTE_BASIS,
        isBond: true,
      })
    }
    for (const c of cedears) {
      assets.set(c.Cedears, {
        ticker: c.Cedears,
        name: c.Name,
        logoTicker: c.TickerOriginal,
        unitPrice: c.price,
        isBond: false,
      })
    }
    return assets
  }, [cedears, bonds])

  const selectedSet = useMemo(() => new Set(rows.map((r) => r.ticker)), [rows])
  const rawByTicker = useMemo(
    () => new Map(rows.map((r) => [r.ticker, r])),
    [rows],
  )
  const knownTickers = useMemo(
    () => new Set(assetByTicker.keys()),
    [assetByTicker],
  )

  function addTicker(ticker: string) {
    setRows((current) =>
      current.some((r) => r.ticker === ticker)
        ? current
        : [
            ...current,
            {
              ticker,
              quantity: 0,
              targetPct: 0,
              colorIndex: nextColorIndex(current),
            },
          ],
    )
  }

  function removeTicker(ticker: string) {
    setRows((current) => current.filter((r) => r.ticker !== ticker))
  }

  function clearPortfolio() {
    const previous = rows
    setRows([])
    toast.success("Cartera vaciada", {
      action: { label: "Deshacer", onClick: () => setRows(previous) },
    })
  }

  function updateRow(ticker: string, patch: Partial<RebalanceEntry>) {
    setRows((current) =>
      current.map((r) => (r.ticker === ticker ? { ...r, ...patch } : r)),
    )
  }

  function importFromPortfolio() {
    const holdings = readPortfolioHoldings()
    const entries = Object.entries(holdings).filter(([ticker]) =>
      assetByTicker.has(ticker),
    )
    if (entries.length === 0) {
      toast.error("No hay CEDEARs del portfolio para importar")
      return
    }
    setRows(
      withColorIndexes(
        entries.map(([ticker, quantity]) => ({
          ticker,
          quantity,
          targetPct: 0,
        })),
      ),
    )
    toast.success("Portfolio importado", {
      description: `${entries.length} activos. Reemplaza la tabla actual.`,
    })
  }

  function exportCsv() {
    const blob = new Blob([portfolioToCsv(rows)], {
      type: "text/csv;charset=utf-8",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `cartera-rebalanceo-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast.success("Cartera exportada", {
      description: `${rows.length} activos. Podés volver a importarla con "Importar CSV".`,
    })
  }

  async function importCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    const { known, unknownTickers } = partitionPortfolioEntries(
      parsePortfolioCsv(await file.text()),
      knownTickers,
    )

    if (known.length === 0) {
      toast.error("No se pudo importar el archivo", {
        description:
          unknownTickers.length > 0
            ? `Tickers desconocidos omitidos: ${unknownTickers.join(", ")}.`
            : "El formato esperado es: ticker,nominales,objetivo_pct",
      })
      return
    }

    setRows(withColorIndexes(known))
    if (unknownTickers.length > 0) {
      toast.success("Cartera importada", {
        description: `${known.length} activos. Se omitieron tickers desconocidos: ${unknownTickers.join(", ")}.`,
      })
    } else {
      toast.success("Cartera importada", {
        description: `${known.length} activos. Reemplaza la tabla actual.`,
      })
    }
  }

  function distributeEqually() {
    setRows((current) => {
      if (current.length === 0) return current
      const even = Math.round((100 / current.length) * 10) / 10
      return current.map((r) => ({ ...r, targetPct: even }))
    })
  }

  const inputs: RebalanceInput[] = useMemo(
    () =>
      rows
        .map((r): RebalanceInput | null => {
          const asset = assetByTicker.get(r.ticker)
          if (!asset) return null
          return {
            cedear: {
              Cedears: asset.ticker,
              Name: asset.name,
              TickerOriginal: asset.logoTicker ?? "",
              price: asset.unitPrice,
            },
            quantity: r.quantity,
            targetPct: r.targetPct,
          }
        })
        .filter((v): v is RebalanceInput => v !== null),
    [rows, assetByTicker],
  )

  const rebalance = useMemo(() => computeRebalance(inputs), [inputs])
  const accumulation = useMemo(
    () => computeAccumulation(inputs, contribution),
    [inputs, contribution],
  )
  const result = mode === "accumulate" ? accumulation : rebalance
  const isAccumulate = mode === "accumulate"

  const colorByTicker = useMemo(
    () => new Map(rows.map((r) => [r.ticker, donutColor(r.colorIndex)])),
    [rows],
  )

  const bondCount = result.rows.filter(
    (row) => assetByTicker.get(row.ticker)?.isBond,
  ).length
  const cedearCount = result.rows.length - bondCount

  const currentSegments: DonutSegment[] = useMemo(
    () =>
      result.rows
        .map((row) => ({
          key: row.ticker,
          label: row.ticker,
          value: row.currentValue,
          color: colorByTicker.get(row.ticker) ?? donutColor(0),
        }))
        .filter((s) => s.value > 0),
    [result.rows, colorByTicker],
  )

  const afterSegments: DonutSegment[] = useMemo(
    () =>
      result.rows
        .map((row) => ({
          key: row.ticker,
          label: row.ticker,
          value: isAccumulate ? row.newValue : row.targetValue,
          color: colorByTicker.get(row.ticker) ?? donutColor(0),
        }))
        .filter((s) => s.value > 0),
    [result.rows, isAccumulate, colorByTicker],
  )

  const operations = useMemo(
    () => result.rows.filter((row) => row.deltaNominales !== 0),
    [result.rows],
  )

  const targetSumOk = Math.abs(result.targetSum - 100) < 0.5
  const required = accumulation.requiredContribution
  const showRequired =
    isAccumulate && required != null && required >= 1

  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept=".csv,text/csv,text/plain"
      className="hidden"
      onChange={importCsv}
    />
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CedearPicker
          cedears={cedears}
          bonds={bonds}
          selected={selectedSet}
          onAdd={addTicker}
        />
        {rows.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button type="button" variant="outline" size="sm">
                    <FolderDownIcon data-icon="inline-start" />
                    Importar / exportar
                    <ChevronDownIcon data-icon="inline-end" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="min-w-52">
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={importFromPortfolio}>
                    <FolderDownIcon data-icon="inline-start" />
                    Importar Portfolio
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FileUpIcon data-icon="inline-start" />
                    Importar CSV
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={exportCsv}>
                  <FileDownIcon data-icon="inline-start" />
                  Exportar CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={distributeEqually}
                aria-label="Distribuir 100% en partes iguales"
              >
                <EqualIcon data-icon="inline-start" />
                Partes iguales
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={clearPortfolio}
              >
                <Trash2Icon data-icon="inline-start" />
                Vaciar cartera
              </Button>
            </div>
          </div>
        )}
      </div>
      {fileInput}

      {rows.length === 0 ? (
        <Empty className="rounded-[var(--radius-m)] border border-border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ScaleIcon />
            </EmptyMedia>
            <EmptyTitle>Armá tu cartera</EmptyTitle>
            <EmptyDescription>
              Agregá CEDEARs o bonos y cargá cuántos nominales tenés de cada uno
              para ver la composición actual y calcular el rebalanceo.
            </EmptyDescription>
          </EmptyHeader>
          <div className="flex flex-wrap justify-center gap-2">
            <Button type="button" variant="outline" onClick={importFromPortfolio}>
              <FolderDownIcon className="size-4" />
              Importar desde mi Portfolio
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUpIcon className="size-4" />
              Importar CSV
            </Button>
          </div>
        </Empty>
      ) : (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-medium">¿Cómo querés rebalancear?</h2>
            <div
              role="radiogroup"
              aria-label="Modo de rebalanceo"
              className="grid gap-2 sm:grid-cols-2"
            >
              {MODES.map((option) => {
                const selected = mode === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setMode(option.value)}
                    className={cn(
                      "flex flex-col gap-1 rounded-[var(--radius-m)] border border-border bg-card p-3 text-left transition-colors outline-none hover:bg-muted/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gui-color-1)]",
                      selected && "border-foreground ring-1 ring-foreground",
                    )}
                  >
                    <span className="text-sm font-medium">{option.label}</span>
                    <span className="text-sm text-muted-foreground">
                      {option.description}
                    </span>
                  </button>
                )
              })}
            </div>

            {isAccumulate && (
              <div className="flex flex-col gap-2">
                <label htmlFor="rebalance-contribution" className="text-sm font-medium">
                  ¿Cuánto querés invertir?
                </label>
                <div className="relative w-full sm:max-w-xs">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="rebalance-contribution"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="any"
                    value={contribution > 0 ? contribution : ""}
                    onChange={(e) =>
                      setContribution(e.target.value === "" ? 0 : Number(e.target.value))
                    }
                    className="pl-7 font-mono"
                    aria-label="Monto a invertir en ARS"
                  />
                </div>
                {showRequired && (
                  <p className="text-sm text-muted-foreground">
                    Para llegar exactamente al objetivo sin vender necesitás aportar{" "}
                    <span className="font-mono font-medium text-foreground">
                      {formatArs(required)}
                    </span>
                    .{" "}
                    <button
                      type="button"
                      className="underline underline-offset-4 hover:text-foreground"
                      onClick={() => setContribution(Math.ceil(required ?? 0))}
                    >
                      Usar este monto
                    </button>
                  </p>
                )}
              </div>
            )}
          </section>

          <section className="grid gap-6 rounded-[var(--radius-m)] border border-border bg-card p-4 sm:grid-cols-2">
            <figure className="flex flex-col items-center gap-3">
              <figcaption className="text-sm font-medium text-muted-foreground">
                Composición actual
              </figcaption>
              <PortfolioDonut
                segments={currentSegments}
                centerLabel="Total"
                centerValue={formatArs(result.totalValue)}
                ariaLabel="Composición actual del portfolio"
                emptyMessage="Cargá nominales para ver tu composición actual."
              />
            </figure>
            <figure className="flex flex-col items-center gap-3">
              <figcaption className="text-sm font-medium text-muted-foreground">
                {isAccumulate
                  ? "Composición después de comprar"
                  : "Composición objetivo"}
              </figcaption>
              <PortfolioDonut
                segments={afterSegments}
                centerLabel={isAccumulate ? "Total" : "Objetivo"}
                centerValue={
                  isAccumulate
                    ? formatArs(accumulation.totalValue + accumulation.invested)
                    : targetSumOk
                      ? "100%"
                      : formatPercent(result.targetSum)
                }
                ariaLabel={
                  isAccumulate
                    ? "Composición del portfolio después de la compra"
                    : "Composición objetivo del portfolio"
                }
                emptyMessage={
                  isAccumulate
                    ? "Definí porcentajes objetivo y un monto a invertir."
                    : "Definí porcentajes objetivo para ver tu meta."
                }
              />
            </figure>
          </section>

          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {result.rows.length} {result.rows.length === 1 ? "activo" : "activos"}
            </span>{" "}
            en la cartera
            {bondCount > 0 &&
              ` (${cedearCount} ${cedearCount === 1 ? "CEDEAR" : "CEDEARs"} y ${bondCount} ${bondCount === 1 ? "bono" : "bonos"})`}
            .
          </p>

          <div className="overflow-hidden rounded-[var(--radius-m)] border border-border">
            <Table className="min-w-[48rem]">
              <TableHeader>
                <TableRow className="bg-muted hover:bg-muted">
                  <TableHead className="min-w-24">Ticker</TableHead>
                  <TableHead className="min-w-24 text-right">Precio</TableHead>
                  <TableHead className="min-w-28 text-right">Nominales</TableHead>
                  <TableHead className="min-w-24 text-right">Valor</TableHead>
                  <TableHead className="min-w-20 text-right">% actual</TableHead>
                  <TableHead className="min-w-28 text-right">% objetivo</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.rows.map((row) => {
                  const raw = rawByTicker.get(row.ticker)
                  const asset = assetByTicker.get(row.ticker)
                  const isBond = asset?.isBond ?? false
                  return (
                    <TableRow key={row.ticker} className="bg-card hover:bg-muted/50">
                      <TableCell>
                        <span className="flex items-center gap-2">
                          <ColorDot color={colorByTicker.get(row.ticker)} />
                          {asset?.logoTicker ? (
                            <img
                              src={logoUrl(asset.logoTicker) || "/placeholder.svg"}
                              alt=""
                              width={16}
                              height={16}
                              className="size-4 shrink-0 rounded-sm bg-muted object-contain"
                              loading="lazy"
                            />
                          ) : (
                            <LandmarkIcon
                              className="size-4 shrink-0 text-muted-foreground"
                              aria-hidden
                            />
                          )}
                          <span className="font-mono font-medium">{row.ticker}</span>
                        </span>
                        {isBond && (
                          <span className="block text-xs text-muted-foreground">
                            {row.name}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className={numericCell}>
                        {isBond && row.price !== null ? (
                          <>
                            {formatArs(row.price * BOND_QUOTE_BASIS)}
                            <span className="block text-xs text-muted-foreground">
                              c/100 VN
                            </span>
                          </>
                        ) : (
                          formatArs(row.price)
                        )}
                      </TableCell>
                      <TableCell className={numericCell}>
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          step="any"
                          value={raw && raw.quantity > 0 ? raw.quantity : ""}
                          onChange={(e) =>
                            updateRow(row.ticker, {
                              quantity:
                                e.target.value === "" ? 0 : Number(e.target.value),
                            })
                          }
                          className="ml-auto w-24 text-right font-mono"
                          aria-label={`Nominales de ${row.ticker}`}
                        />
                      </TableCell>
                      <TableCell className={numericCell}>
                        {formatArs(row.currentValue)}
                      </TableCell>
                      <TableCell className={numericCell}>
                        {formatPercent(row.currentPct)}
                      </TableCell>
                      <TableCell className={numericCell}>
                        <Input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          max={100}
                          step="any"
                          value={raw && raw.targetPct > 0 ? raw.targetPct : ""}
                          onChange={(e) =>
                            updateRow(row.ticker, {
                              targetPct:
                                e.target.value === "" ? 0 : Number(e.target.value),
                            })
                          }
                          className="ml-auto w-20 text-right font-mono"
                          aria-label={`Porcentaje objetivo de ${row.ticker}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-foreground"
                          onClick={() => removeTicker(row.ticker)}
                          aria-label={`Quitar ${row.ticker}`}
                        >
                          <Trash2Icon className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <p
            className={cn(
              "text-sm",
              targetSumOk ? "text-muted-foreground" : "text-destructive",
            )}
          >
            Suma de objetivos: {formatPercent(result.targetSum)}.{" "}
            {targetSumOk
              ? "Distribución completa."
              : "Se normaliza automáticamente al 100% para el cálculo."}
          </p>

          <section className="flex flex-col gap-3">
            <h2 className="text-[length:var(--size-l)] leading-[var(--line-l)] font-semibold tracking-[var(--letter-spacing-l)]">
              Operaciones sugeridas
            </h2>
            {operations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {isAccumulate
                  ? "Con este monto no alcanza para comprar ningún nominal (o falta definir porcentajes objetivo)."
                  : "Tu cartera ya está balanceada según el objetivo (o falta definir porcentajes y nominales)."}
              </p>
            ) : (
              <div className="overflow-hidden rounded-[var(--radius-m)] border border-border">
                <Table className="min-w-[40rem]">
                  <TableHeader>
                    <TableRow className="bg-muted hover:bg-muted">
                      <TableHead className="min-w-28">Operación</TableHead>
                      <TableHead className="min-w-24">Ticker</TableHead>
                      <TableHead className="min-w-28 text-right">Nominales</TableHead>
                      <TableHead className="min-w-28 text-right">Monto aprox.</TableHead>
                      <TableHead className="min-w-28 text-right">
                        Nominales final
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {operations.map((row) => {
                      const isBuy = row.deltaNominales > 0
                      return (
                        <TableRow
                          key={row.ticker}
                          className="bg-card hover:bg-muted/50"
                        >
                          <TableCell>
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 font-medium",
                                isBuy
                                  ? "text-success"
                                  : "text-destructive",
                              )}
                            >
                              {isBuy ? (
                                <ArrowUpIcon className="size-4" />
                              ) : (
                                <ArrowDownIcon className="size-4" />
                              )}
                              {isBuy ? "Comprar" : "Vender"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center gap-2">
                              <ColorDot color={colorByTicker.get(row.ticker)} />
                              <span className="font-mono font-medium">
                                {row.ticker}
                              </span>
                            </span>
                          </TableCell>
                          <TableCell className={numericCell}>
                            {Math.abs(row.deltaNominales)}
                          </TableCell>
                          <TableCell className={numericCell}>
                            {formatArs(
                              row.price !== null
                                ? Math.abs(row.deltaNominales) * row.price
                                : null,
                            )}
                          </TableCell>
                          <TableCell className={numericCell}>
                            {row.newQuantity}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
            {isAccumulate && accumulation.invested > 0 && (
              <p className="text-sm text-muted-foreground">
                Total a invertir:{" "}
                <span className="font-mono font-medium text-foreground">
                  {formatArs(accumulation.invested)}
                </span>
                .
              </p>
            )}
            {Math.abs(result.residualCash) >= 0.01 && (
              <p className="text-sm text-muted-foreground">
                {isAccumulate
                  ? "Vuelto sin invertir por redondeo a nominales enteros: "
                  : "Efectivo remanente por redondeo a nominales enteros: "}
                <span className="font-mono font-medium text-foreground">
                  {formatArs(result.residualCash)}
                </span>
                .
              </p>
            )}
            {result.hasMissingPrices && (
              <p className="text-sm text-destructive">
                Algunos activos no tienen precio disponible y se excluyen del cálculo.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  )
}
