"use client"

import { useMemo } from "react"
import type { ImplicitDollarRow } from "@/lib/implicit-dollar"

const PADDING = { top: 16, right: 16, bottom: 36, left: 80 }
const Y_AXIS_TITLE_X = 12

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
  const chart = useMemo(() => {
    if (rows.length === 0) return null

    const xs = rows.map((row) => row.implicitFx)
    const ys = rows.map((row) => row.tradedValue)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    const spanX = maxX - minX || 1
    const spanY = maxY - minY || 1

    return {
      minX,
      maxX,
      minY,
      maxY,
      spanX,
      spanY,
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

  const width = 640
  const height = 280
  const plotWidth = width - PADDING.left - PADDING.right
  const plotHeight = height - PADDING.top - PADDING.bottom

  const toPlotX = (value: number) =>
    PADDING.left + ((value - chart.minX) / chart.spanX) * plotWidth
  const toPlotY = (value: number) =>
    PADDING.top + plotHeight - ((value - chart.minY) / chart.spanY) * plotHeight

  const avgX = toPlotX(average)
  const yTicks = [chart.minY, (chart.minY + chart.maxY) / 2, chart.maxY]
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
          y1={PADDING.top + plotHeight}
          x2={PADDING.left + plotWidth}
          y2={PADDING.top + plotHeight}
          className="stroke-border"
        />
        <line
          x1={PADDING.left}
          y1={PADDING.top}
          x2={PADDING.left}
          y2={PADDING.top + plotHeight}
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
              y={height - 8}
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
          y2={PADDING.top + plotHeight}
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
          y={height - 0}
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
        Puntos y línea punteada excluyen outliers (promedio: {formatAxisFx(average)}).
      </figcaption>
    </figure>
  )
}
