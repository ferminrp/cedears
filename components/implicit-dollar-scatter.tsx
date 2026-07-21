"use client"

import { useEffect, useMemo, useState } from "react"
import type { ImplicitDollarRow } from "@/lib/implicit-dollar"
import { Skeleton } from "@/components/ui/skeleton"

const PADDING = { top: 16, right: 16, bottom: 48, left: 80 }
const Y_AXIS_TITLE_X = 12
const X_TICK_OFFSET = 14
const X_TITLE_OFFSET = 34
const AXIS_PADDING_RATIO = 0.08

function paddedDomain(min: number, max: number, ratio = AXIS_PADDING_RATIO) {
  const span = max - min || Math.abs(max) || 1
  return { min: min - span * ratio, max: max + span * ratio, span: span * (1 + ratio * 2) }
}

function paddedLogDomain(min: number, max: number, ratio = AXIS_PADDING_RATIO) {
  const safeMin = Math.max(min, 1)
  const safeMax = Math.max(max, safeMin * 1.01)
  const logMin = Math.log10(safeMin)
  const logMax = Math.log10(safeMax)
  const logSpan = logMax - logMin || 1
  const pad = logSpan * ratio

  return {
    min: Math.pow(10, logMin - pad),
    max: Math.pow(10, logMax + pad),
    logMin: logMin - pad,
    logMax: logMax + pad,
    logSpan: logSpan + pad * 2,
  }
}

const arsAxisCompactFormatter = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
})

const arsAxisFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const fxAxisFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

function formatAxisArs(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `$ ${arsAxisCompactFormatter.format(value / 1_000_000)} M`
  }
  return arsAxisFormatter.format(value)
}

function formatAxisFx(value: number): string {
  return fxAxisFormatter.format(value)
}

export function ImplicitDollarScatter({
  rows,
  average,
}: {
  rows: ImplicitDollarRow[]
  average: number
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const chart = useMemo(() => {
    if (rows.length === 0) return null

    const xs = rows.map((row) => row.implicitFx)
    const ys = rows.map((row) => row.tradedValue)
    const xDomain = paddedDomain(Math.min(...xs), Math.max(...xs))
    const yDomain = paddedLogDomain(Math.min(...ys), Math.max(...ys))
    const midY = Math.sqrt(yDomain.min * yDomain.max)

    return {
      minX: xDomain.min,
      maxX: xDomain.max,
      spanX: xDomain.span,
      minY: yDomain.min,
      maxY: yDomain.max,
      midY,
      logMinY: yDomain.logMin,
      logSpanY: yDomain.logSpan,
      points: rows.map((row) => ({
        id: row.cedear.Cedears,
        x: row.implicitFx,
        y: row.tradedValue,
      })),
    }
  }, [rows])

  if (!chart) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay datos suficientes para el gráfico.
      </p>
    )
  }

  if (!mounted) {
    return (
      <figure className="w-full">
        <Skeleton
          className="h-[280px] w-full rounded-md"
          aria-label="Cargando gráfico de dispersión"
        />
      </figure>
    )
  }

  const width = 640
  const height = 280
  const plotWidth = width - PADDING.left - PADDING.right
  const plotHeight = height - PADDING.top - PADDING.bottom

  const toPlotX = (value: number) =>
    PADDING.left + ((value - chart.minX) / chart.spanX) * plotWidth
  const toPlotY = (value: number) =>
    PADDING.top +
    plotHeight -
    ((Math.log10(Math.max(value, chart.minY)) - chart.logMinY) / chart.logSpanY) *
      plotHeight

  const avgX = toPlotX(average)
  const axisY = PADDING.top + plotHeight
  const xTickY = axisY + X_TICK_OFFSET
  const xTitleY = axisY + X_TITLE_OFFSET
  const yTicks = [chart.minY, chart.midY, chart.maxY]
  const xTicks = [chart.minX, (chart.minX + chart.maxX) / 2, chart.maxX]

  return (
    <figure className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full text-muted-foreground"
        role="img"
        aria-label="Dispersión de dólar implícito versus monto operado"
      >
        <line
          x1={PADDING.left}
          y1={axisY}
          x2={PADDING.left + plotWidth}
          y2={axisY}
          className="stroke-border"
        />
        <line
          x1={PADDING.left}
          y1={PADDING.top}
          x2={PADDING.left}
          y2={axisY}
          className="stroke-border"
        />

        {yTicks.map((tick) => {
          const y = toPlotY(tick)
          return (
            <g key={`y-${tick}`}>
              <line
                x1={PADDING.left}
                y1={y}
                x2={PADDING.left + plotWidth}
                y2={y}
                className="stroke-border/40"
                strokeDasharray="3 3"
              />
              <text
                x={PADDING.left - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-muted-foreground text-[10px]"
              >
                {formatAxisArs(tick)}
              </text>
            </g>
          )
        })}

        {xTicks.map((tick) => {
          const x = toPlotX(tick)
          return (
            <text
              key={`x-${tick}`}
              x={x}
              y={xTickY}
              textAnchor="middle"
              className="fill-muted-foreground text-[10px]"
            >
              {formatAxisFx(tick)}
            </text>
          )
        })}

        <line
          x1={avgX}
          y1={PADDING.top}
          x2={avgX}
          y2={axisY}
          className="stroke-foreground/50"
          strokeDasharray="4 4"
        />

        {chart.points.map((point) => (
          <circle
            key={point.id}
            cx={toPlotX(point.x)}
            cy={toPlotY(point.y)}
            r={3}
            className="fill-foreground/70"
          >
            <title>
              {point.id}: {formatAxisFx(point.x)} · {formatAxisArs(point.y)}
            </title>
          </circle>
        ))}

        <text
          x={width / 2}
          y={xTitleY}
          textAnchor="middle"
          className="fill-muted-foreground text-[10px]"
        >
          Dólar implícito (ARS)
        </text>
        <text
          x={Y_AXIS_TITLE_X}
          y={height / 2}
          textAnchor="middle"
          transform={`rotate(-90 ${Y_AXIS_TITLE_X} ${height / 2})`}
          className="fill-muted-foreground text-[10px]"
        >
          Volumen × precio
        </text>
      </svg>
      <figcaption className="mt-2 text-xs text-muted-foreground">
        Puntos y línea punteada excluyen outliers. Eje Y en escala logarítmica
        (promedio: {formatAxisFx(average)}).
      </figcaption>
    </figure>
  )
}
