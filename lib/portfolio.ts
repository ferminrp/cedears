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
