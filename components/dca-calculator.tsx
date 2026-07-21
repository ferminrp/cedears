"use client"

import { useMemo, useState } from "react"
import { CalendarClockIcon, Trash2Icon } from "lucide-react"

import { type Cedear, formatArs } from "@/lib/cedears"
import { logoUrl } from "@/lib/logo"
import {
  computeDca,
  donutColor,
  formatPercent,
  formatSignedPercent,
  type DcaInput,
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
  targetPct: number
}

const numericCell = "text-right font-mono tabular-nums"

export function DcaCalculator({ cedears }: { cedears: Cedear[] }) {
  const [amount, setAmount] = useState<number>(100000)
  const [rows, setRows] = useState<RowState[]>([])

  const cedearByTicker = useMemo(
    () => new Map(cedears.map((c) => [c.Cedears, c])),
    [cedears],
  )

  const selectedSet = useMemo(() => new Set(rows.map((r) => r.ticker)), [rows])
  const rawByTicker = useMemo(
    () => new Map(rows.map((r) => [r.ticker, r])),
    [rows],
  )

  function addTicker(ticker: string) {
    setRows((current) =>
      current.some((r) => r.ticker === ticker)
        ? current
        : [...current, { ticker, targetPct: 0 }],
    )
  }

  function removeTicker(ticker: string) {
    setRows((current) => current.filter((r) => r.ticker !== ticker))
  }

  function updateTarget(ticker: string, value: number) {
    setRows((current) =>
      current.map((r) => (r.ticker === ticker ? { ...r, targetPct: value } : r)),
    )
  }

  function distributeEqually() {
    setRows((current) => {
      if (current.length === 0) return current
      const even = Math.round((100 / current.length) * 10) / 10
      return current.map((r) => ({ ...r, targetPct: even }))
    })
  }

  const inputs: DcaInput[] = useMemo(
    () =>
      rows
        .map((r): DcaInput | null => {
          const cedear = cedearByTicker.get(r.ticker)
          if (!cedear) return null
          return {
            cedear: {
              Cedears: cedear.Cedears,
              Name: cedear.Name,
              TickerOriginal: cedear.TickerOriginal,
              price: cedear.price,
            },
            targetPct: r.targetPct,
          }
        })
        .filter((v): v is DcaInput => v !== null),
    [rows, cedearByTicker],
  )

  const result = useMemo(() => computeDca(amount, inputs), [amount, inputs])

  const segments: DonutSegment[] = useMemo(
    () =>
      result.rows
        .map((row, index) => ({
          key: row.ticker,
          label: row.ticker,
          value: row.invested,
          color: donutColor(index),
        }))
        .filter((s) => s.value > 0),
    [result.rows],
  )

  const targetSumOk = Math.abs(result.targetSum - 100) < 0.5

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <label htmlFor="dca-amount" className="text-sm font-medium">
          ¿Cuánto querés invertir por mes?
        </label>
        <div className="relative w-full sm:max-w-xs">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-muted-foreground">
            $
          </span>
          <Input
            id="dca-amount"
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            value={amount > 0 ? amount : ""}
            onChange={(e) => setAmount(e.target.value === "" ? 0 : Number(e.target.value))}
            className="pl-7 font-mono"
            aria-label="Monto mensual a invertir en ARS"
          />
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CedearPicker cedears={cedears} selected={selectedSet} onAdd={addTicker} />
        {rows.length > 0 && (
          <Button type="button" variant="outline" size="sm" onClick={distributeEqually}>
            Distribuir 100% en partes iguales
          </Button>
        )}
      </div>

      {rows.length === 0 ? (
        <Empty className="rounded-lg border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarClockIcon />
            </EmptyMedia>
            <EmptyTitle>Definí tu estrategia DCA</EmptyTitle>
            <EmptyDescription>
              Agregá CEDEARs y asigná el porcentaje de tu inversión mensual para
              cada uno. Te decimos cuántos nominales comprar y cuánto vuelto queda.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <section className="grid gap-6 rounded-lg border bg-card p-4 sm:grid-cols-[auto_1fr] sm:items-center">
            <figure className="flex flex-col items-center gap-3">
              <figcaption className="text-sm font-medium text-muted-foreground">
                Distribución real
              </figcaption>
              <PortfolioDonut
                segments={segments}
                centerLabel="Invertido"
                centerValue={formatArs(result.totalInvested)}
                ariaLabel="Distribución real de la compra mensual"
                emptyMessage="Cargá porcentajes para ver la distribución."
              />
            </figure>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">A invertir</p>
                <p className="font-mono text-lg font-semibold tabular-nums">
                  {formatArs(result.amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Invertido real</p>
                <p className="font-mono text-lg font-semibold tabular-nums">
                  {formatArs(result.totalInvested)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vuelto (sin invertir)</p>
                <p className="font-mono text-lg font-semibold tabular-nums">
                  {formatArs(result.leftover)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">% ejecutado</p>
                <p className="font-mono text-lg font-semibold tabular-nums">
                  {formatPercent(
                    result.amount > 0
                      ? (result.totalInvested / result.amount) * 100
                      : 0,
                  )}
                </p>
              </div>
            </div>
          </section>

          <div className="overflow-hidden rounded-lg border">
            <Table className="min-w-[52rem]">
              <TableHeader>
                <TableRow className="bg-muted hover:bg-muted">
                  <TableHead className="min-w-24">Ticker</TableHead>
                  <TableHead className="min-w-24 text-right">Precio</TableHead>
                  <TableHead className="min-w-24 text-right">% deseado</TableHead>
                  <TableHead className="min-w-24 text-right">Nominales</TableHead>
                  <TableHead className="min-w-28 text-right">Invertido</TableHead>
                  <TableHead className="min-w-20 text-right">% real</TableHead>
                  <TableHead className="min-w-24 text-right">Desvío</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.rows.map((row) => {
                  const raw = rawByTicker.get(row.ticker)
                  const notableDeviation = Math.abs(row.deviation) >= 1
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
                          inputMode="decimal"
                          min={0}
                          max={100}
                          step="any"
                          value={raw && raw.targetPct > 0 ? raw.targetPct : ""}
                          onChange={(e) =>
                            updateTarget(
                              row.ticker,
                              e.target.value === "" ? 0 : Number(e.target.value),
                            )
                          }
                          className="ml-auto w-20 text-right font-mono"
                          aria-label={`Porcentaje deseado de ${row.ticker}`}
                        />
                      </TableCell>
                      <TableCell className={cn(numericCell, "font-semibold")}>
                        {row.nominales}
                      </TableCell>
                      <TableCell className={numericCell}>{formatArs(row.invested)}</TableCell>
                      <TableCell className={numericCell}>{formatPercent(row.actualPct)}</TableCell>
                      <TableCell
                        className={cn(
                          numericCell,
                          notableDeviation ? "text-destructive" : "text-muted-foreground",
                        )}
                      >
                        {formatSignedPercent(row.deviation)}
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
            Suma de porcentajes deseados: {formatPercent(result.targetSum)}.{" "}
            {targetSumOk
              ? "Distribución completa."
              : "Se normaliza automáticamente al 100% para el cálculo."}
          </p>

          <p className="text-sm text-muted-foreground text-pretty">
            El <strong className="font-medium text-foreground">vuelto</strong> es la
            plata que no alcanza para comprar un nominal entero más. El{" "}
            <strong className="font-medium text-foreground">desvío</strong> muestra
            cuánto se aparta la distribución real del porcentaje deseado por el precio
            de cada CEDEAR.
          </p>

          {result.hasMissingPrices && (
            <p className="text-sm text-destructive">
              Algunos CEDEARs no tienen precio disponible y se excluyen del cálculo.
            </p>
          )}
        </>
      )}
    </div>
  )
}
