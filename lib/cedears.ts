export type Cedear = {
  Cedears: string
  Name: string
  Market: string
  Ratio: string
  TickerOriginal: string
  price: number | null
  pctChange: number | null
  usPrice: number | null
  priceMep: number | null
  priceCcl: number | null
}

export type CedearBase = {
  Cedears: string
  Name: string
  Market: string
  Ratio: string
  TickerOriginal: string
}

type LiveQuote = {
  symbol: string
  c: number
  pct_change: number
}

const DATA_URL =
  "https://raw.githubusercontent.com/ferminrp/google-sheets-argento/refs/heads/main/data/cedears.json"

const LIVE_QUOTES_URL = "https://data912.com/live/arg_cedears"
const USA_QUOTES_URL = "https://data912.com/live/usa_stocks"

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isCedearBase(value: unknown): value is CedearBase {
  return (
    isRecord(value) &&
    typeof value.Cedears === "string" &&
    typeof value.Name === "string" &&
    typeof value.Market === "string" &&
    typeof value.Ratio === "string" &&
    typeof value.TickerOriginal === "string"
  )
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
  return {
    symbol: value.symbol,
    c: value.c,
    pct_change: value.pct_change,
  }
}

async function getLiveQuotes(url: string): Promise<Map<string, LiveQuote>> {
  const res = await fetch(url, {
    next: { revalidate: 60 },
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
      usPrice: quotePrice(usaQuotes, c.TickerOriginal),
      priceMep: quotePrice(argQuotes, `${ticker}D`),
      priceCcl: quotePrice(argQuotes, `${ticker}C`),
    }
  })
}

export async function getCedearBases(): Promise<CedearBase[]> {
  const res = await fetch(DATA_URL, {
    // Revalidate once a day: the list of available CEDEARs changes rarely.
    next: { revalidate: 86400 },
  })

  if (!res.ok) {
    throw new Error(`No se pudo obtener la lista de CEDEARs (HTTP ${res.status})`)
  }

  const data: unknown = await res.json()
  if (!Array.isArray(data) || !data.every(isCedearBase)) {
    throw new Error("Lista de CEDEARs inválida")
  }

  return data
}

export async function getCedears(): Promise<Cedear[]> {
  const data = await getCedearBases()

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

  if (!argQuotes && !usaQuotes) {
    return withEmptyQuotes(data)
  }

  return mergeQuotes(data, argQuotes, usaQuotes)
}

export function parseRatio(ratio: string): number | null {
  const value = Number(ratio)
  if (!Number.isFinite(value) || value <= 0) return null
  return value
}

export function fairUsdPrice(cedear: Cedear): number | null {
  const ratio = parseRatio(cedear.Ratio)
  if (cedear.usPrice === null || ratio === null) return null
  return cedear.usPrice / ratio
}

export function premiumPct(
  quotedUsd: number | null,
  fairUsd: number | null,
): number | null {
  if (quotedUsd === null || fairUsd === null || fairUsd === 0) return null
  return ((quotedUsd - fairUsd) / fairUsd) * 100
}

export function implicitFxRate(
  arsPrice: number | null,
  usdPrice: number | null,
): number | null {
  if (arsPrice === null || usdPrice === null || usdPrice === 0) return null
  return arsPrice / usdPrice
}

function formatPrice(value: number | null): string {
  if (value === null) return "—"
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatPctChange(value: number | null): string {
  if (value === null) return "—"
  const formatted = new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    signDisplay: "exceptZero",
  }).format(value)
  return `${formatted}%`
}

const COLUMNS = [
  { key: "Cedears", label: "Ticker" },
  { key: "Name", label: "Empresa" },
  { key: "Market", label: "Mercado" },
  { key: "Ratio", label: "Ratio" },
  { key: "TickerOriginal", label: "Ticker original" },
  { key: "price", label: "Precio" },
  { key: "pctChange", label: "Var. %" },
] as const

function cellValue(cedear: Cedear, key: (typeof COLUMNS)[number]["key"]): string {
  if (key === "price") return formatPrice(cedear.price)
  if (key === "pctChange") return formatPctChange(cedear.pctChange)
  return String(cedear[key])
}

export function toMarkdown(cedears: Cedear[]): string {
  const header = `| ${COLUMNS.map((c) => c.label).join(" | ")} |`
  const divider = `| ${COLUMNS.map(() => "---").join(" | ")} |`
  const rows = cedears.map(
    (c) => `| ${COLUMNS.map((col) => cellValue(c, col.key).replace(/\|/g, "\\|")).join(" | ")} |`,
  )
  return [header, divider, ...rows].join("\n")
}

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function toCsv(cedears: Cedear[]): string {
  const header = COLUMNS.map((c) => escapeCsv(c.label)).join(",")
  const rows = cedears.map((c) =>
    COLUMNS.map((col) => escapeCsv(cellValue(c, col.key))).join(","),
  )
  return [header, ...rows].join("\n")
}
