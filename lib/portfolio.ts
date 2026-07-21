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

  for (const [ticker, quantity] of Object.entries(holdings)) {
    if (!isValidQuantity(quantity)) continue

    const cedear = cedearByTicker.get(ticker)
    if (!cedear) continue

    titulos += 1

    if (cedear.price !== null) {
      valorArs += quantity * cedear.price
    }
  }

  return {
    titulos,
    valorArs,
    valorMep: mepAverage > 0 ? valorArs / mepAverage : null,
    valorCable: cableAverage > 0 ? valorArs / cableAverage : null,
  }
}
