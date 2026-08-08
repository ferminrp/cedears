import { getSiteUrl } from "@/lib/site"

export type Cedear = {
  Cedears: string
  Name: string
  Market: string
  Ratio: string
  TickerOriginal: string
  tags: string[]
  price: number | null
  pctChange: number | null
  volume: number | null
  usPrice: number | null
  priceMep: number | null
  priceCcl: number | null
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

const arsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

const usdFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const pctFormatter = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
  signDisplay: "exceptZero",
})

const volumeFormatter = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 0,
})

export function formatArs(value: number | null): string {
  if (value === null) return "—"
  return arsFormatter.format(value)
}

export function formatUsd(value: number | null): string {
  if (value === null) return "—"
  return usdFormatter.format(value)
}

export function formatPct(value: number | null): string {
  if (value === null) return "—"
  return `${pctFormatter.format(value)}%`
}

export function pctClassName(value: number | null): string {
  if (value === null || value === 0) return "text-muted-foreground"
  if (value > 0) return "text-emerald-600 dark:text-emerald-400"
  return "text-red-600 dark:text-red-400"
}

export function formatVolume(value: number | null): string {
  if (value === null) return "—"
  return volumeFormatter.format(value)
}

type ColumnKey =
  | keyof Cedear
  | "fairUsd"
  | "premiumMep"

const COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: "Cedears", label: "Ticker" },
  { key: "Name", label: "Empresa" },
  { key: "Market", label: "Mercado" },
  { key: "Ratio", label: "Ratio" },
  { key: "TickerOriginal", label: "Ticker original" },
  { key: "price", label: "Precio ARS" },
  { key: "pctChange", label: "Var. %" },
  { key: "volume", label: "Volumen" },
  { key: "usPrice", label: "Precio US" },
  { key: "priceMep", label: "Precio MEP" },
  { key: "priceCcl", label: "Precio CCL" },
  { key: "fairUsd", label: "Precio justo USD" },
  { key: "premiumMep", label: "Prima %" },
  { key: "tags", label: "Tags" },
]

function cellValue(cedear: Cedear, key: ColumnKey): string {
  switch (key) {
    case "price":
      return formatArs(cedear.price)
    case "pctChange":
      return formatPct(cedear.pctChange)
    case "volume":
      return formatVolume(cedear.volume)
    case "usPrice":
      return formatUsd(cedear.usPrice)
    case "priceMep":
      return formatUsd(cedear.priceMep)
    case "priceCcl":
      return formatUsd(cedear.priceCcl)
    case "fairUsd":
      return formatUsd(fairUsdPrice(cedear))
    case "premiumMep":
      return formatPct(premiumPct(cedear.priceMep, fairUsdPrice(cedear)))
    case "tags":
      return cedear.tags.length > 0 ? cedear.tags.join(", ") : "—"
    default:
      return String(cedear[key])
  }
}

export function toMarkdown(cedears: Cedear[]): string {
  const header = `| ${COLUMNS.map((c) => c.label).join(" | ")} |`
  const divider = `| ${COLUMNS.map(() => "---").join(" | ")} |`
  const rows = cedears.map(
    (c) =>
      `| ${COLUMNS.map((col) => cellValue(c, col.key).replace(/\|/g, "\\|")).join(" | ")} |`,
  )
  return [header, divider, ...rows].join("\n")
}

export function toMarkdownDocument(cedears: Cedear[]): string {
  const siteUrl = getSiteUrl()
  const generatedAt = new Date().toISOString()
  const preamble = [
    "# Listado de CEDEARs en Argentina",
    "",
    `Fuente: [${siteUrl}/cedears.md](${siteUrl}/cedears.md)`,
    `Generado: ${generatedAt}`,
    `Cantidad: ${cedears.length}`,
    "",
    "Precio ARS = cotización BYMA en pesos. Precio US = subyacente en USD. Precio MEP/CCL = cotización del CEDEAR en dólar MEP (tickerD) y cable (tickerC). Precio justo USD = Precio US ÷ Ratio. Prima % = (Precio MEP − Precio justo) / Precio justo.",
    "",
    "",
  ].join("\n")

  return `${preamble}${toMarkdown(cedears)}\n`
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
