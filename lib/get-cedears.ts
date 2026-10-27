import { cache } from "react"
import { unstable_cache } from "next/cache"
import { type Cedear } from "@/lib/cedears"

export type CedearBase = {
  Cedears: string
  Name: string
  Market: string
  Ratio: string
  TickerOriginal: string
  yahooSymbol: string | null
  tags: string[]
  yfinanceFetchedAt?: string
}

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

function parseYahooSymbol(value: unknown): string | null {
  if (!isRecord(value)) return null
  const meta = value["yfinance-metadata"]
  if (!isRecord(meta)) return null
  const symbol = meta.yahoo_symbol
  if (typeof symbol !== "string") return null
  const trimmed = symbol.trim()
  return trimmed ? trimmed : null
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

  const yfinanceMeta = value["yfinance-metadata"]
  const fetchedAt =
    isRecord(yfinanceMeta) && typeof yfinanceMeta.fetched_at === "string"
      ? yfinanceMeta.fetched_at
      : undefined

  return {
    Cedears: value.Cedears,
    Name: value.Name,
    Market: value.Market,
    Ratio: value.Ratio,
    TickerOriginal: value.TickerOriginal,
    yahooSymbol: parseYahooSymbol(value),
    tags: parseTags(value.tags),
    yfinanceFetchedAt: fetchedAt,
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
    next: { revalidate: 300 },
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

function withEmptyQuotes(cedears: CedearBase[]): Cedear[] {
  return cedears.map((c) => ({
    ...c,
    price: null,
    pctChange: null,
    volume: null,
    usPrice: null,
    priceMep: null,
    priceCcl: null,
  }))
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

  const { yahooFinance } = await import("@/lib/yahoo-finance")

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

async function loadCedearBasesPayload(): Promise<CedearBase[]> {
  const res = await fetch(DATA_URL, {
    next: { revalidate: 86400 },
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

const getCedearBasesCached = unstable_cache(
  loadCedearBasesPayload,
  ["cedear-bases"],
  { revalidate: 86400 },
)

export async function getCedearBases(): Promise<CedearBase[]> {
  return getCedearBasesCached()
}

function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase()
}

export async function getCedearByTicker(ticker: string): Promise<Cedear | null> {
  const normalized = normalizeTicker(ticker)
  const cedears = await getCedears()
  return cedears.find((c) => normalizeTicker(c.Cedears) === normalized) ?? null
}

type CedearsPayload = {
  cedears: Cedear[]
  livePricesFetchedAtIso: string
}

async function loadCedearsPayload(): Promise<CedearsPayload> {
  const livePricesFetchedAtIso = new Date().toISOString()

  const [data, liveResults] = await Promise.all([
    getCedearBases(),
    Promise.allSettled([
      getLiveQuotes(LIVE_QUOTES_URL),
      getLiveQuotes(USA_QUOTES_URL),
    ]),
  ])

  const [argResult, usaResult] = liveResults

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

  const merged =
    !argQuotes && !usaQuotes
      ? withEmptyQuotes(data)
      : mergeQuotes(data, argQuotes, usaQuotes)

  const cedears = await fillMissingUsPrices(merged)
  return { cedears, livePricesFetchedAtIso }
}

const getCedearsPayloadCached = unstable_cache(
  loadCedearsPayload,
  ["cedears-live-v3"],
  { revalidate: 300 },
)

export async function getCedearsLivePricesFetchedAt(): Promise<Date | null> {
  const iso = (await getCedearsPayloadCached()).livePricesFetchedAtIso
  const parsed = new Date(iso)
  return Number.isFinite(parsed.getTime()) ? parsed : null
}

export const getCedears = cache(async (): Promise<Cedear[]> => {
  return (await getCedearsPayloadCached()).cedears
})
