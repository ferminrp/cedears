"use client"

import { useMemo, useState } from "react"
import {
  type Cedear,
  fairUsdPrice,
  formatArs,
  formatUsd,
  parseRatio,
} from "@/lib/cedears"
import {
  cedearsToShares,
  sharesToCedears,
  theoreticalArsAtCcl,
} from "@/lib/ratios"
import { CedearPicker } from "@/components/cedear-picker"
import { Input } from "@/components/ui/input"

const numericCell = "text-right font-mono tabular-nums text-sm"

function parsePositiveInput(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed.replace(",", "."))
  if (!Number.isFinite(parsed) || parsed < 0) return null
  return parsed
}

export function RatioConversionCalculator({
  cedears,
  cclAverage,
  cclAvailable,
}: {
  cedears: Cedear[]
  cclAverage: number
  cclAvailable: boolean
}) {
  const [ticker, setTicker] = useState("")
  const [cedearQty, setCedearQty] = useState("10")
  const [shareQty, setShareQty] = useState("")

  const cedear = useMemo(
    () => cedears.find((c) => c.Cedears === ticker) ?? null,
    [cedears, ticker],
  )

  const ratio = cedear ? parseRatio(cedear.Ratio) : null
  const parsedCedears = parsePositiveInput(cedearQty)
  const parsedShares = parsePositiveInput(shareQty)

  const sharesFromCedears =
    cedear && ratio !== null && parsedCedears !== null
      ? cedearsToShares(parsedCedears, ratio)
      : null

  const cedearsFromShares =
    cedear && ratio !== null && parsedShares !== null
      ? sharesToCedears(parsedShares, ratio)
      : null

  const fairUsd = cedear ? fairUsdPrice(cedear) : null
  const theoreticalArs =
    cedear && cclAvailable ? theoreticalArsAtCcl(cedear, cclAverage) : null

  const cclFormatter = useMemo(
    () =>
      new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }),
    [],
  )

  return (
    <div className="flex flex-col gap-6 rounded-[var(--radius-m)] border border-border bg-card p-[var(--space-l)] md:p-[var(--space-xl)]">
      <div>
        <h2 className="text-base font-medium">Calculadora de conversión</h2>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">
          Convertí entre CEDEARs y acciones según el ratio del emisor.
          {cclAvailable ? (
            <>
              {" "}
              El precio teórico en pesos usa el CCL implícito promedio del listado (
              {cclFormatter.format(cclAverage)}), el mismo criterio que{" "}
              <a href="/dolar-cable" className="underline underline-offset-4">
                Dólar cable
              </a>
              .
            </>
          ) : (
            " El precio teórico en pesos no está disponible sin cotización CCL."
          )}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">CEDEAR</span>
        {ticker ? (
          <p className="font-mono text-sm">
            Seleccionado: <strong>{ticker}</strong>
            <button
              type="button"
              className="ml-2 text-muted-foreground underline underline-offset-4 hover:text-foreground"
              onClick={() => setTicker("")}
            >
              Cambiar
            </button>
          </p>
        ) : null}
        <CedearPicker
          cedears={cedears}
          selected={new Set()}
          onAdd={setTicker}
          placeholder="Buscar por ticker o empresa"
        />
      </div>

      {cedear && ratio !== null ? (
        <p className="text-sm text-muted-foreground">
          Ratio {cedear.Ratio}:1 · 1 acción de {cedear.TickerOriginal} equivale a{" "}
          {cedear.Ratio} CEDEAR{Number(cedear.Ratio) === 1 ? "" : "s"} de{" "}
          {cedear.Cedears}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="ratio-cedear-qty" className="text-sm font-medium">
            Cantidad de CEDEARs
          </label>
          <Input
            id="ratio-cedear-qty"
            type="text"
            inputMode="decimal"
            value={cedearQty}
            onChange={(e) => setCedearQty(e.target.value)}
            placeholder="Ej. 10"
          />
          {sharesFromCedears !== null ? (
            <p className={`${numericCell} text-muted-foreground`}>
              ≈ {sharesFromCedears.toLocaleString("es-AR", { maximumFractionDigits: 4 })}{" "}
              acción{sharesFromCedears === 1 ? "" : "es"}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="ratio-share-qty" className="text-sm font-medium">
            Cantidad de acciones
          </label>
          <Input
            id="ratio-share-qty"
            type="text"
            inputMode="decimal"
            value={shareQty}
            onChange={(e) => setShareQty(e.target.value)}
            placeholder="Ej. 1"
          />
          {cedearsFromShares !== null ? (
            <p className={`${numericCell} text-muted-foreground`}>
              ≈{" "}
              {cedearsFromShares.toLocaleString("es-AR", {
                maximumFractionDigits: 4,
              })}{" "}
              CEDEAR{cedearsFromShares === 1 ? "" : "s"}
            </p>
          ) : null}
        </div>
      </div>

      {cedear ? (
        <dl className="grid gap-3 border-t border-border pt-4 text-sm sm:grid-cols-2">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-muted-foreground">Precio teórico USD (CEDEAR)</dt>
            <dd className={numericCell}>{formatUsd(fairUsd)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-muted-foreground">Precio teórico ARS al CCL</dt>
            <dd className={numericCell}>{formatArs(theoreticalArs)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3 sm:col-span-2">
            <dt className="text-muted-foreground">Precio de mercado ARS</dt>
            <dd className={numericCell}>{formatArs(cedear.price)}</dd>
          </div>
        </dl>
      ) : (
        <p className="text-sm text-muted-foreground">
          Elegí un CEDEAR para ver conversiones y precios teóricos.
        </p>
      )}
    </div>
  )
}
