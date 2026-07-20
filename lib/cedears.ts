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
