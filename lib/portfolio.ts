import { type Cedear } from "@/lib/cedears"

export type PortfolioHoldings = Record<string, number>

export const PORTFOLIO_STORAGE_KEY = "cedears-portfolio-holdings"

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isValidQuantity(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
}

function sanitizeHoldings(value: unknown): PortfolioHoldings {
  if (!isPlainObject(value)) return {}

  const holdings: PortfolioHoldings = {}
  for (const [ticker, quantity] of Object.entries(value)) {
    if (isValidQuantity(quantity)) {
      holdings[ticker] = quantity
    }
  }
  return holdings
}

export function readPortfolioHoldings(): PortfolioHoldings {
  if (typeof window === "undefined") return {}

  try {
    const raw = localStorage.getItem(PORTFOLIO_STORAGE_KEY)
    if (raw === null) return {}
    return sanitizeHoldings(JSON.parse(raw))
  } catch {
    return {}
  }
}

export function writePortfolioHoldings(holdings: PortfolioHoldings): void {
  if (typeof window === "undefined") return

  const sanitized: PortfolioHoldings = {}
  for (const [ticker, quantity] of Object.entries(holdings)) {
    if (isValidQuantity(quantity)) {
      sanitized[ticker] = quantity
    }
  }

  localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(sanitized))
}

export function prunePortfolioHoldings(
  holdings: PortfolioHoldings,
  validTickers: Set<string>,
): PortfolioHoldings {
  const pruned: PortfolioHoldings = {}

  for (const [ticker, quantity] of Object.entries(holdings)) {
    if (validTickers.has(ticker) && isValidQuantity(quantity)) {
      pruned[ticker] = quantity
    }
  }

  return pruned
}

export function setHoldingQuantity(
  holdings: PortfolioHoldings,
  ticker: string,
  quantity: number,
): PortfolioHoldings {
  if (!isValidQuantity(quantity)) {
    const next = { ...holdings }
    delete next[ticker]
    return next
  }

  return { ...holdings, [ticker]: quantity }
}

export type PortfolioSummary = {
  titulos: number
  valorArs: number
  valorMep: number | null
  valorCable: number | null
  variacionArs: number | null
  variacionMep: number | null
  variacionCable: number | null
  variacionPct: number | null
}

export function previousPriceFromChange(
  price: number,
  pctChange: number,
): number | null {
  const factor = 1 + pctChange / 100
  if (factor === 0 || !Number.isFinite(factor)) return null
  const previous = price / factor
  return Number.isFinite(previous) ? previous : null
}

export function computePortfolioSummary(
  cedears: Cedear[],
  holdings: PortfolioHoldings,
  mepAverage: number,
  cableAverage: number,
): PortfolioSummary {
  const cedearByTicker = new Map(cedears.map((cedear) => [cedear.Cedears, cedear]))

  let titulos = 0
  let valorArs = 0
  let valorArsHoyConCambio = 0
  let valorArsPrevio = 0
  let hasDailyChange = false

  for (const [ticker, quantity] of Object.entries(holdings)) {
    if (!isValidQuantity(quantity)) continue

    const cedear = cedearByTicker.get(ticker)
    if (!cedear) continue

    titulos += 1

    if (cedear.price === null) continue

    valorArs += quantity * cedear.price

    if (cedear.pctChange === null) continue

    const previous = previousPriceFromChange(cedear.price, cedear.pctChange)
    if (previous === null) continue

    hasDailyChange = true
    valorArsHoyConCambio += quantity * cedear.price
    valorArsPrevio += quantity * previous
  }

  const variacionArs = hasDailyChange
    ? valorArsHoyConCambio - valorArsPrevio
    : null
  const variacionPct =
    variacionArs !== null && valorArsPrevio > 0
      ? (variacionArs / valorArsPrevio) * 100
      : null

  return {
    titulos,
    valorArs,
    valorMep: mepAverage > 0 ? valorArs / mepAverage : null,
    valorCable: cableAverage > 0 ? valorArs / cableAverage : null,
    variacionArs,
    variacionMep:
      variacionArs !== null && mepAverage > 0 ? variacionArs / mepAverage : null,
    variacionCable:
      variacionArs !== null && cableAverage > 0
        ? variacionArs / cableAverage
        : null,
    variacionPct,
  }
}

export type PortfolioCompositionSegment = {
  ticker: string
  name: string
  valueArs: number
  pct: number
}

export function computePortfolioComposition(
  cedears: Cedear[],
  holdings: PortfolioHoldings,
): PortfolioCompositionSegment[] {
  const cedearByTicker = new Map(cedears.map((cedear) => [cedear.Cedears, cedear]))

  const segments: Omit<PortfolioCompositionSegment, "pct">[] = []
  let totalValue = 0

  for (const [ticker, quantity] of Object.entries(holdings)) {
    if (!isValidQuantity(quantity)) continue

    const cedear = cedearByTicker.get(ticker)
    if (!cedear || cedear.price === null) continue

    const valueArs = quantity * cedear.price
    if (valueArs <= 0) continue

    segments.push({
      ticker,
      name: cedear.Name,
      valueArs,
    })
    totalValue += valueArs
  }

  segments.sort((a, b) => b.valueArs - a.valueArs)

  return segments.map((segment) => ({
    ...segment,
    pct: totalValue > 0 ? (segment.valueArs / totalValue) * 100 : 0,
  }))
}

/* ------------------------------------------------------------------ */
/* Mobile helpers (pure; no change to the persisted format)            */
/* ------------------------------------------------------------------ */

/**
 * Match a ticker from a URL param (e.g. `?agregar=spy`) against the known
 * list, ignoring case. Returns the canonical ticker or null.
 */
export function resolvePortfolioTicker(
  raw: string | null | undefined,
  validTickers: Iterable<string>,
): string | null {
  if (typeof raw !== "string") return null
  const wanted = raw.trim().toUpperCase()
  if (wanted === "") return null
  for (const ticker of validTickers) {
    if (ticker.toUpperCase() === wanted) return ticker
  }
  return null
}

/**
 * Parse what the user typed as nominales. Accepts "10", "1.000" (es-AR
 * thousands), "2,5" / "2.5" (decimal). Empty → 0. Invalid or negative → null.
 */
export function parseQuantityInput(raw: string): number | null {
  const value = raw.trim().replace(/\s/g, "")
  if (value === "") return 0

  let normalized: string
  if (/^\d{1,3}(\.\d{3})+$/.test(value)) {
    normalized = value.replace(/\./g, "")
  } else if (/^\d{1,3}(\.\d{3})+,\d+$/.test(value)) {
    normalized = value.replace(/\./g, "").replace(",", ".")
  } else if (/^\d+([.,]\d+)?$/.test(value)) {
    normalized = value.replace(",", ".")
  } else {
    return null
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

/** Stepper: add `delta` nominales, never below zero. */
export function stepQuantity(current: number, delta: number): number {
  const base = Number.isFinite(current) && current > 0 ? current : 0
  const next = base + delta
  if (!Number.isFinite(next) || next <= 0) return 0
  // Avoid float noise for fractional holdings (0.1 + 0.2).
  return Math.round(next * 1e6) / 1e6
}

export type PortfolioHoldingRow = {
  ticker: string
  name: string
  quantity: number
  price: number | null
  valueArs: number | null
  /** Share of the portfolio's ARS value; null when the price is unknown. */
  pct: number | null
}

/**
 * Only the tickers the user holds (nominales > 0), largest value first;
 * holdings without a price go last, alphabetically.
 */
export function computePortfolioHoldingRows(
  cedears: Cedear[],
  holdings: PortfolioHoldings,
): PortfolioHoldingRow[] {
  const cedearByTicker = new Map(cedears.map((cedear) => [cedear.Cedears, cedear]))
  const rows: PortfolioHoldingRow[] = []
  let total = 0

  for (const [ticker, quantity] of Object.entries(holdings)) {
    if (!isValidQuantity(quantity)) continue
    const cedear = cedearByTicker.get(ticker)
    if (!cedear) continue
    const valueArs = cedear.price === null ? null : quantity * cedear.price
    if (valueArs !== null && valueArs > 0) total += valueArs
    rows.push({
      ticker,
      name: cedear.Name,
      quantity,
      price: cedear.price,
      valueArs,
      pct: null,
    })
  }

  for (const row of rows) {
    row.pct =
      row.valueArs !== null && total > 0 ? (row.valueArs / total) * 100 : null
  }

  return rows.sort((a, b) => {
    if (a.valueArs === null && b.valueArs === null)
      return a.ticker.localeCompare(b.ticker, "es")
    if (a.valueArs === null) return 1
    if (b.valueArs === null) return -1
    return b.valueArs - a.valueArs || a.ticker.localeCompare(b.ticker, "es")
  })
}
