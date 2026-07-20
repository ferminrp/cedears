export type Cedear = {
  Cedears: string
  Name: string
  Market: string
  Ratio: string
  TickerOriginal: string
  price: number | null
  pctChange: number | null
}

type CedearBase = {
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

async function getLiveQuotes(): Promise<Map<string, LiveQuote>> {
  const res = await fetch(LIVE_QUOTES_URL, {
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

function withEmptyQuotes(cedears: CedearBase[]): Cedear[] {
  return cedears.map((c) => ({
    ...c,
    price: null,
    pctChange: null,
  }))
}

function mergeQuotes(cedears: CedearBase[], quotes: Map<string, LiveQuote>): Cedear[] {
  return cedears.map((c) => {
    const quote = quotes.get(normalizeSymbol(c.Cedears))
    if (!quote) {
      return { ...c, price: null, pctChange: null }
    }
    return {
      ...c,
      price: quote.c,
      pctChange: quote.pct_change,
    }
  })
}

export async function getCedears(): Promise<Cedear[]> {
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

  try {
    const quotes = await getLiveQuotes()
    return mergeQuotes(data, quotes)
  } catch (error) {
    console.error("No se pudieron obtener precios de data912", error)
    return withEmptyQuotes(data)
  }
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
