import { type Cedear, parseRatio } from "@/lib/cedears"

const AR_TIMEZONE = "America/Argentina/Buenos_Aires"

const updatedDateFormatter = new Intl.DateTimeFormat("es-AR", {
  timeZone: AR_TIMEZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
})

export function formatRatiosDataDate(date: Date = new Date()): string {
  return updatedDateFormatter.format(date)
}

export type RatiosCsvRow = {
  ticker: string
  empresa: string
  ratio: string
  precioArs: string
}

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function toRatiosCsv(cedears: Cedear[]): string {
  const header = ["Ticker", "Empresa", "Ratio", "Precio ARS"].join(",")
  const lines = cedears.map((c) => {
    const row: RatiosCsvRow = {
      ticker: c.Cedears,
      empresa: c.Name,
      ratio: c.Ratio,
      precioArs: c.price !== null ? String(c.price) : "",
    }
    return [row.ticker, row.empresa, row.ratio, row.precioArs]
      .map(escapeCsvCell)
      .join(",")
  })
  return [header, ...lines].join("\n")
}

export function cedearsToShares(cedearCount: number, ratio: number): number {
  if (!Number.isFinite(cedearCount) || !Number.isFinite(ratio) || ratio <= 0) {
    return 0
  }
  return cedearCount / ratio
}

export function sharesToCedears(shareCount: number, ratio: number): number {
  if (!Number.isFinite(shareCount) || !Number.isFinite(ratio) || ratio <= 0) {
    return 0
  }
  return shareCount * ratio
}

export function theoreticalArsAtCcl(
  cedear: Cedear,
  cclAverage: number,
): number | null {
  const ratio = parseRatio(cedear.Ratio)
  if (cedear.usPrice === null || ratio === null || cclAverage <= 0) return null
  const fairUsd = cedear.usPrice / ratio
  return fairUsd * cclAverage
}
