import { formatArs } from "@/lib/cedears"
import type { HistoricalBar } from "@/lib/historical"

const CHART_WIDTH = 640
const CHART_HEIGHT = 220
const PADDING = { top: 16, right: 12, bottom: 28, left: 12 }
const DAYS_SHOWN = 252

function formatChartDate(date: string): string {
  const [year, month, day] = date.split("-")
  return `${day}/${month}/${year.slice(2)}`
}

export function CedearPriceChart({
  ticker,
  history,
}: {
  ticker: string
  history: HistoricalBar[]
}) {
  const data = history.slice(-DAYS_SHOWN)

  if (data.length < 2) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay suficientes datos históricos para mostrar el gráfico de {ticker}.
      </p>
    )
  }

  const prices = data.map((bar) => bar.c)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const range = maxPrice - minPrice || 1

  const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right
  const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom

  const points = data.map((bar, index) => {
    const x =
      PADDING.left + (index / (data.length - 1)) * innerWidth
    const y =
      PADDING.top +
      innerHeight -
      ((bar.c - minPrice) / range) * innerHeight
    return { x, y, bar }
  })

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ")

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${PADDING.top + innerHeight} L ${points[0].x} ${PADDING.top + innerHeight} Z`

  const first = data[0]
  const last = data[data.length - 1]
  const changePct = ((last.c - first.c) / first.c) * 100
  const changeClass =
    changePct > 0
      ? "text-emerald-600 dark:text-emerald-400"
      : changePct < 0
        ? "text-red-600 dark:text-red-400"
        : "text-muted-foreground"

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <p className="text-muted-foreground">
          Últimos {data.length} días · {formatChartDate(first.date)} —{" "}
          {formatChartDate(last.date)}
        </p>
        <p className={`font-mono tabular-nums ${changeClass}`}>
          {changePct > 0 ? "+" : ""}
          {changePct.toFixed(2)}%
        </p>
      </div>

      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        role="img"
        aria-label={`Gráfico de precio histórico del CEDEAR ${ticker}`}
        className="h-auto w-full"
      >
        <defs>
          <linearGradient id={`chart-fill-${ticker}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path
          d={areaPath}
          fill={`url(#chart-fill-${ticker})`}
          className="text-primary"
        />
        <path
          d={linePath}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-primary"
        />

        <text
          x={PADDING.left}
          y={CHART_HEIGHT - 8}
          className="fill-muted-foreground text-[10px]"
        >
          {formatChartDate(first.date)}
        </text>
        <text
          x={CHART_WIDTH - PADDING.right}
          y={CHART_HEIGHT - 8}
          textAnchor="end"
          className="fill-muted-foreground text-[10px]"
        >
          {formatChartDate(last.date)}
        </text>
        <text
          x={PADDING.left}
          y={PADDING.top}
          className="fill-muted-foreground text-[10px]"
        >
          {formatArs(maxPrice)}
        </text>
        <text
          x={PADDING.left}
          y={PADDING.top + innerHeight}
          className="fill-muted-foreground text-[10px]"
        >
          {formatArs(minPrice)}
        </text>
      </svg>

      <p className="text-xs text-muted-foreground">
        Precio de cierre en pesos argentinos. Fuente:{" "}
        <a
          href={`https://data912.com/historical/cedears/${encodeURIComponent(ticker)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground underline underline-offset-4"
        >
          data912
        </a>
        .
      </p>
    </div>
  )
}
