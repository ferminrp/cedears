"use client"

import { useMemo, useState } from "react"
import { ArrowDownIcon, ArrowUpIcon, DownloadIcon, ScaleIcon, Trash2Icon } from "lucide-react"

import { type Cedear, formatArs } from "@/lib/cedears"
import { logoUrl } from "@/lib/logo"
import { readPortfolioHoldings } from "@/lib/portfolio"
import {
  computeRebalance,
  donutColor,
  formatPercent,
  type RebalanceInput,
} from "@/lib/tools"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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

type RowState = {
  ticker: string
  quantity: number
  targetPct: number
}

const numericCell = "text-right font-mono tabular-nums"

export function RebalanceCalculator({ cedears }: { cedears: Cedear[] }) {
  const [rows, setRows] = useState<RowState[]>([])

  const cedearByTicker = useMemo(
    () => new Map(cedears.map((c) => [c.Cedears, c])),
    [cedears],
  )

  const selectedSet = useMemo(
    () => new Set(rows.map((r) => r.ticker)),
    [rows],
  )

  const rawByTicker = useMemo(
    () => new Map(rows.map((r) => [r.ticker, r])),
    [rows],
  )

  function addTicker(ticker: string) {
    setRows((current) =>
      current.some((r) => r.ticker === ticker)
        ? current
        : [...current, { ticker, quantity: 0, targetPct: 0 }],
    )
  }

  function removeTicker(ticker: string) {
    setRows((current) => current.filter((r) => r.ticker !== ticker))
  }

  function updateRow(ticker: string, patch: Partial<RowState>) {
    setRows((current) =>
      current.map((r) => (r.ticker === ticker ? { ...r, ...patch } : r)),
    )
  }

  function importFromPortfolio() {
    const holdings = readPortfolioHoldings()
    const entries = Object.entries(holdings).filter(([ticker]) =>
      cedearByTicker.has(ticker),
    )
    if (entries.length === 0) return
    setRows(
      entries.map(([ticker, quantity]) => ({
        ticker,
        quantity,
        targetPct: 0,
      })),
    )
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
          const cedear = cedearByTicker.get(r.ticker)
          if (!cedear) return null
          return {
            cedear: {
              Cedears: cedear.Cedears,
              Name: cedear.Name,
              TickerOriginal: cedear.TickerOriginal,
              price: cedear.price,
            },
            quantity: r.quantity,
            targetPct: r.targetPct,
          }
        })
        .filter((v): v is RebalanceInput => v !== null),
    [rows, cedearByTicker],
  )

  const result = useMemo(() => computeRebalance(inputs), [inputs])

  const currentSegments: DonutSegment[] = useMemo(
    () =>
      result.rows
        .map((row, index) => ({
          key: row.ticker,
          label: row.ticker,
          value: row.currentValue,
          color: donutColor(index),
        }))
        .filter((s) => s.value > 0),
    [result.rows],
  )

  const targetSegments: DonutSegment[] = useMemo(
    () =>
      result.rows
        .map((row, index) => ({
          key: row.ticker,
          label: row.ticker,
          value: row.targetValue,
          color: donutColor(index),
        }))
        .filter((s) => s.value > 0),
    [result.rows],
  )

  const operations = useMemo(
    () => result.rows.filter((row) => row.deltaNominales !== 0),
    [result.rows],
  )

  const targetSumOk = Math.abs(result.targetSum - 100) < 0.5

  if (rows.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <CedearPicker cedears={cedears} selected={selectedSet} onAdd={addTicker} />
        <Empty className="rounded-lg border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ScaleIcon />
            </EmptyMedia>
            <EmptyTitle>Armá tu cartera</EmptyTitle>
            <EmptyDescription>
              Agregá CEDEARs y cargá cuántos nominales tenés de cada uno para ver
              la composición actual y calcular el rebalanceo.
            </EmptyDescription>
          </EmptyHeader>
          <Button type="button" variant="outline" onClick={importFromPortfolio}>
            <DownloadIcon className="size-4" />
            Importar desde mi Portfolio
          </Button>
        </Empty>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CedearPicker cedears={cedears} selected={selectedSet} onAdd={addTicker} />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={importFromPortfolio}>
            <DownloadIcon className="size-4" />
            Importar Portfolio
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={distributeEqually}>
            Distribuir 100% en partes iguales
          </Button>
        </div>
      </div>

      {/* Composición */}
      <section className="grid gap-6 rounded-lg border bg-card p-4 sm:grid-cols-2">
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
            Composición objetivo
          </figcaption>
          <PortfolioDonut
            segments={targetSegments}
            centerLabel="Objetivo"
            centerValue={targetSumOk ? "100%" : formatPercent(result.targetSum)}
            ariaLabel="Composición objetivo del portfolio"
            emptyMessage="Definí porcentajes objetivo para ver tu meta."
          />
        </figure>
      </section>

      {/* Tabla de entradas */}
      <div className="overflow-hidden rounded-lg border">
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
              return (
              <TableRow key={row.ticker} className="bg-card hover:bg-muted/50">
                <TableCell>
                  <span className="flex items-center gap-1.5">
                    <img
                      src={logoUrl(row.tickerOriginal) || "/placeholder.svg"}
                      alt=""
                      width={16}
                      height={16}
                      className="size-4 shrink-0 rounded-sm bg-muted object-contain"
                      loading="lazy"
                    />
                    <span className="font-mono font-medium">{row.ticker}</span>
                  </span>
                </TableCell>
                <TableCell className={numericCell}>{formatArs(row.price)}</TableCell>
                <TableCell className={numericCell}>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step="any"
                    value={raw && raw.quantity > 0 ? raw.quantity : ""}
                    onChange={(e) =>
                      updateRow(row.ticker, {
                        quantity: e.target.value === "" ? 0 : Number(e.target.value),
                      })
                    }
                    className="ml-auto w-24 text-right font-mono"
                    aria-label={`Nominales de ${row.ticker}`}
                  />
                </TableCell>
                <TableCell className={numericCell}>{formatArs(row.currentValue)}</TableCell>
                <TableCell className={numericCell}>{formatPercent(row.currentPct)}</TableCell>
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
                        targetPct: e.target.value === "" ? 0 : Number(e.target.value),
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

      {/* Operaciones */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Operaciones sugeridas</h2>
        {operations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Tu cartera ya está balanceada según el objetivo (o falta definir
            porcentajes y nominales).
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <Table className="min-w-[40rem]">
              <TableHeader>
                <TableRow className="bg-muted hover:bg-muted">
                  <TableHead className="min-w-28">Operación</TableHead>
                  <TableHead className="min-w-24">Ticker</TableHead>
                  <TableHead className="min-w-28 text-right">Nominales</TableHead>
                  <TableHead className="min-w-28 text-right">Monto aprox.</TableHead>
                  <TableHead className="min-w-28 text-right">Nominales final</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {operations.map((row) => {
                  const isBuy = row.deltaNominales > 0
                  return (
                    <TableRow key={row.ticker} className="bg-card hover:bg-muted/50">
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 font-medium",
                            isBuy
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-red-600 dark:text-red-400",
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
                      <TableCell className="font-mono font-medium">{row.ticker}</TableCell>
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
                      <TableCell className={numericCell}>{row.newQuantity}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
        {Math.abs(result.residualCash) >= 0.01 && (
          <p className="text-sm text-muted-foreground">
            Efectivo remanente por redondeo a nominales enteros:{" "}
            <span className="font-mono font-medium text-foreground">
              {formatArs(result.residualCash)}
            </span>
            .
          </p>
        )}
        {result.hasMissingPrices && (
          <p className="text-sm text-destructive">
            Algunos CEDEARs no tienen precio disponible y se excluyen del cálculo.
          </p>
        )}
      </section>
    </div>
  )
}
