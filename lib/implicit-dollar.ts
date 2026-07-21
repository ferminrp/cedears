import { type Cedear, implicitFxRate } from "@/lib/cedears"

export type DollarKind = "mep" | "cable"

export type ImplicitDollarRow = {
  cedear: Cedear
  implicitFx: number
  tradedValue: number
}

export type ImplicitDollarSummary = {
  average: number
  count: number
  outlierCount: number
  rows: ImplicitDollarRow[]
  scatterRows: ImplicitDollarRow[]
}

function usdPriceForKind(cedear: Cedear, kind: DollarKind): number | null {
  return kind === "mep" ? cedear.priceMep : cedear.priceCcl
}

export function getImplicitDollarRows(
  cedears: Cedear[],
  kind: DollarKind,
): ImplicitDollarRow[] {
  const rows: ImplicitDollarRow[] = []

  for (const cedear of cedears) {
    const usdPrice = usdPriceForKind(cedear, kind)
    const implicitFx = implicitFxRate(cedear.price, usdPrice)
    if (implicitFx === null || cedear.price === null) continue

    const volume = cedear.volume ?? 0
    const tradedValue = volume * cedear.price

    rows.push({ cedear, implicitFx, tradedValue })
  }

  return rows.sort((a, b) => a.implicitFx - b.implicitFx)
}

function getOutlierBounds(values: number[]): { lower: number; upper: number } | null {
  if (values.length < 4) return null

  const sorted = [...values].sort((a, b) => a - b)
  const q1 = percentile(sorted, 0.25)
  const q3 = percentile(sorted, 0.75)
  const iqr = q3 - q1
  return { lower: q1 - 1.5 * iqr, upper: q3 + 1.5 * iqr }
}

export function getScatterRows(rows: ImplicitDollarRow[]): ImplicitDollarRow[] {
  const withVolume = rows.filter((row) => row.tradedValue > 0)
  const bounds = getOutlierBounds(rows.map((row) => row.implicitFx))
  if (!bounds) return withVolume

  return withVolume.filter(
    (row) => row.implicitFx >= bounds.lower && row.implicitFx <= bounds.upper,
  )
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const index = (sorted.length - 1) * p
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  if (lower === upper) return sorted[lower]
  const weight = index - lower
  return sorted[lower] * (1 - weight) + sorted[upper] * weight
}

export function removeOutliers(values: number[]): {
  filtered: number[]
  outlierCount: number
} {
  const bounds = getOutlierBounds(values)
  if (!bounds) return { filtered: values, outlierCount: 0 }

  const filtered = values.filter(
    (v) => v >= bounds.lower && v <= bounds.upper,
  )
  return {
    filtered,
    outlierCount: values.length - filtered.length,
  }
}

export function averageWithoutOutliers(values: number[]): {
  average: number
  outlierCount: number
} {
  if (values.length === 0) {
    return { average: 0, outlierCount: 0 }
  }

  const { filtered, outlierCount } = removeOutliers(values)
  const pool = filtered.length > 0 ? filtered : values
  const average = pool.reduce((sum, value) => sum + value, 0) / pool.length

  return { average, outlierCount }
}

export function summarizeImplicitDollar(
  cedears: Cedear[],
  kind: DollarKind,
): ImplicitDollarSummary {
  const rows = getImplicitDollarRows(cedears, kind)
  const rates = rows.map((row) => row.implicitFx)
  const { average, outlierCount } = averageWithoutOutliers(rates)

  return {
    average,
    count: rows.length,
    outlierCount,
    rows,
    scatterRows: getScatterRows(rows),
  }
}
