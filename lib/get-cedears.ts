import { type Cedear } from "@/lib/cedears"
import {
  mergeCedearQuotes,
  type CedearBase,
  type CedearQuote,
} from "@/lib/merge-cedear-quotes"
import { yahooFinance } from "@/lib/yahoo-finance"

export type { CedearQuote, CedearBase }
export { mergeCedearQuotes } from "@/lib/merge-cedear-quotes"

type LiveQuote = {
  symbol: string
  c: number
  pct_change: number
  v: number
}

const DATA_URL =
  "https://raw.githubusercontent.com/ferminrp/google-sheets-argento/refs/heads/main/data/cedears.json?v=2"

const LIVE_QUOTES_URL = "https://data912.com/live/arg_cedears"
const USA_QUOTES_URL = "https://data912.com/live/usa_stocks"
const YAHOO_QUOTE_CHUNK_SIZE = 80

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function parseTags(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((tag): tag is string => typeof tag === "string")
}

function parseCedearBase(value: unknown): CedearBase | null {
  if (
    !isRecord(value) ||
    typeof value.Cedears !== "string" ||
    typeof value.Name !== "string" ||
    typeof value.Market !== "string" ||
    typeof value.Ratio !== "string" ||
    typeof value.TickerOriginal !== "string"
  ) {
    return null
  }

  return {
    Cedears: value.Cedears,
    Name: value.Name,
    Market: value.Market,
    Ratio: value.Ratio,
    TickerOriginal: value.TickerOriginal,
    tags: parseTags(value.tags),
  }
}

function parseLiveQuote(value: unknown): LiveQuote | null {
  if (!isRecord(value) || typeof value.symbol !== "string") {
    return null
  }
  if (typeof value.c !== "number" || !Number.isFinite(value.c)) {
    return null
  }
  if (typeof value.pct_change !== "number" || !Number.isFinite(value.pct_change)) {
    return null
  }
  const volume =
    typeof value.v === "number" && Number.isFinite(value.v) ? value.v : 0
  return {
    symbol: value.symbol,
    c: value.c,
    pct_change: value.pct_change,
    v: volume,
  }
}

async function getLiveQuotes(url: string): Promise<Map<string, LiveQuote>> {
  const res = await fetch(url, {
    next: { revalidate: 600 },
  })

  if (!res.ok) {
    throw new Error(`No se pudo obtener precios live (HTTP ${res.status})`)
  }

  const data: unknown = await res.json()
  if (!Array.isArray(data)) {
    throw new Error("Respuesta de precios live inválida")
  }

  const quotes = new Map<string, LiveQuote>()
  for (const item of data) {
    const quote = parseLiveQuote(item)
    if (!quote) continue
    quotes.set(normalizeSymbol(quote.symbol), quote)
  }
  return quotes
}

function quotePrice(
  quotes: Map<string, LiveQuote> | null,
  symbol: string,
): number | null {
  if (!quotes) return null
  return quotes.get(normalizeSymbol(symbol))?.c ?? null
}

function mergeQuotes(
  cedears: CedearBase[],
  argQuotes: Map<string, LiveQuote> | null,
  usaQuotes: Map<string, LiveQuote> | null,
): Cedear[] {
  return cedears.map((c) => {
    const ticker = normalizeSymbol(c.Cedears)
    const argQuote = argQuotes?.get(ticker)

    return {
      ...c,
      price: argQuote?.c ?? null,
      pctChange: argQuote?.pct_change ?? null,
      volume: argQuote?.v ?? null,
      usPrice: quotePrice(usaQuotes, c.TickerOriginal),
      priceMep: quotePrice(argQuotes, `${ticker}D`),
      priceCcl: quotePrice(argQuotes, `${ticker}C`),
    }
  })
}

function chunkSymbols(symbols: string[], size: number): string[][] {
  const chunks: string[][] = []
  for (let i = 0; i < symbols.length; i += size) {
    chunks.push(symbols.slice(i, i + size))
  }
  return chunks
}

async function getYahooUnderlyingPrices(
  symbols: string[],
): Promise<Map<string, number>> {
  const prices = new Map<string, number>()
  if (symbols.length === 0) return prices

  for (const chunk of chunkSymbols(symbols, YAHOO_QUOTE_CHUNK_SIZE)) {
    try {
      const quotes = await yahooFinance.quote(chunk, {
        fields: ["symbol", "regularMarketPrice"],
        return: "object",
      })

      for (const symbol of chunk) {
        const quote = quotes[symbol]
        const price = quote?.regularMarketPrice
        if (typeof price === "number" && Number.isFinite(price)) {
          prices.set(normalizeSymbol(symbol), price)
        }
      }
    } catch (error) {
      console.error("No se pudieron obtener precios de Yahoo Finance", {
        symbols: chunk,
        error,
      })
    }
  }

  return prices
}

async function fillMissingUsPrices(cedears: Cedear[]): Promise<Cedear[]> {
  const missing = [
    ...new Set(
      cedears
        .filter((c) => c.usPrice === null)
        .map((c) => normalizeSymbol(c.TickerOriginal)),
    ),
  ]
  if (missing.length === 0) return cedears

  const yahooPrices = await getYahooUnderlyingPrices(missing)
  if (yahooPrices.size === 0) return cedears

  return cedears.map((c) => {
    if (c.usPrice !== null) return c
    const price = yahooPrices.get(normalizeSymbol(c.TickerOriginal))
    if (price === undefined) return c
    return { ...c, usPrice: price }
  })
}

function cedearsToQuoteRecord(cedears: Cedear[]): Record<string, CedearQuote> {
  const record: Record<string, CedearQuote> = {}
  for (const c of cedears) {
    record[normalizeSymbol(c.Cedears)] = {
      price: c.price,
      pctChange: c.pctChange,
      volume: c.volume,
      usPrice: c.usPrice,
      priceMep: c.priceMep,
      priceCcl: c.priceCcl,
    }
  }
  return record
}

async function fetchLiveQuoteMaps(): Promise<{
  argQuotes: Map<string, LiveQuote> | null
  usaQuotes: Map<string, LiveQuote> | null
}> {
  const [argResult, usaResult] = await Promise.allSettled([
    getLiveQuotes(LIVE_QUOTES_URL),
    getLiveQuotes(USA_QUOTES_URL),
  ])

  const argQuotes = argResult.status === "fulfilled" ? argResult.value : null
  const usaQuotes = usaResult.status === "fulfilled" ? usaResult.value : null

  if (!argQuotes) {
    console.error(
      "No se pudieron obtener precios AR de data912",
      argResult.status === "rejected" ? argResult.reason : undefined,
    )
  }
  if (!usaQuotes) {
    console.error(
      "No se pudieron obtener precios USA de data912",
      usaResult.status === "rejected" ? usaResult.reason : undefined,
    )
  }

  return { argQuotes, usaQuotes }
}

async function buildQuotesForBases(
  bases: CedearBase[],
): Promise<Record<string, CedearQuote>> {
  const { argQuotes, usaQuotes } = await fetchLiveQuoteMaps()

  if (!argQuotes && !usaQuotes) {
    return {}
  }

  const merged = mergeQuotes(bases, argQuotes, usaQuotes)
  const filled = await fillMissingUsPrices(merged)
  return cedearsToQuoteRecord(filled)
}

export const CEDEAR_BASES_CACHE_TAG = "cedear-bases"

export async function getCedearBases(): Promise<CedearBase[]> {
  const res = await fetch(DATA_URL, {
    // Revalidate once a day: the list (including tags) changes rarely.
    // The cache tag lets us invalidate this fetch on deploy when the schema changes.
    next: { revalidate: 86400, tags: [CEDEAR_BASES_CACHE_TAG] },
  })

  if (!res.ok) {
    throw new Error(`No se pudo obtener la lista de CEDEARs (HTTP ${res.status})`)
  }

  const data: unknown = await res.json()
  if (!Array.isArray(data)) {
    throw new Error("Lista de CEDEARs inválida")
  }

  const bases = data.map(parseCedearBase)
  if (!bases.every((base): base is CedearBase => base !== null)) {
    throw new Error("Lista de CEDEARs inválida")
  }

  return bases
}

function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase()
}

export async function getCedearBaseByTicker(
  ticker: string,
): Promise<CedearBase | null> {
  const normalized = normalizeTicker(ticker)
  const bases = await getCedearBases()
  return bases.find((c) => normalizeTicker(c.Cedears) === normalized) ?? null
}

export async function getCedearQuotes(): Promise<Record<string, CedearQuote>> {
  const bases = await getCedearBases()
  return buildQuotesForBases(bases)
}

export async function getCedearByTicker(ticker: string): Promise<Cedear | null> {
  const normalized = normalizeTicker(ticker)
  const cedears = await getCedears()
  return cedears.find((c) => normalizeTicker(c.Cedears) === normalized) ?? null
}

export async function getCedears(): Promise<Cedear[]> {
  const bases = await getCedearBases()
  const quotes = await buildQuotesForBases(bases)
  return mergeCedearQuotes(bases, quotes)
}
