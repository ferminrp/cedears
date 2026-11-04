import detectedAtBundle from "@/data/nuevos-cedears-detected-at.json" with { type: "json" }

const AR_TIMEZONE = "America/Argentina/Buenos_Aires"

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  timeZone: AR_TIMEZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
})

const monthYearFormatter = new Intl.DateTimeFormat("es-AR", {
  timeZone: AR_TIMEZONE,
  month: "long",
  year: "numeric",
})

export type NuevoCedearRow = {
  ticker: string
  name: string
  ratio: string
  tickerOriginal: string
  detectedSince: string
}

export type NuevosCedearsDataset = {
  method: string
  sourceRepository: string
  sourcePath: string
  generatedAt: string
  note: string
  entries: NuevoCedearRow[]
}

export type NuevosCedearMonthGroup = {
  id: string
  heading: string
  countLabel: string
  rows: NuevoCedearRow[]
}

export const NUEVOS_CEDEARS_PAGE_H1 = "Nuevos CEDEARs en BYMA"

export const NUEVOS_CEDEARS_METADATA_TITLE =
  "Nuevos CEDEARs en BYMA | CEDEARs Argentina"

export const NUEVOS_CEDEARS_DESCRIPTION =
  "Los últimos CEDEARs listados en BYMA: ticker, empresa, fecha de alta y ratio de conversión. Actualizado a diario."

export const NUEVOS_CEDEARS_LEAD =
  "Los últimos CEDEARs que empezaron a cotizar en BYMA, del más reciente al más antiguo. Tocá uno para ver su ficha, ratio y precio."

const GROUP_BY_MONTH_THRESHOLD = 8
const NUEVO_BADGE_DAYS = 7
const STICKY_SEARCH_THRESHOLD = 60

export function getNuevosCedearsDataset(): NuevosCedearsDataset {
  return detectedAtBundle as NuevosCedearsDataset
}

export function getNuevosCedearsRows(): NuevoCedearRow[] {
  return getNuevosCedearsDataset().entries
}

export function formatDetectedSince(isoDay: string): string {
  const [y, m, d] = isoDay.split("-").map(Number)
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
  return dateFormatter.format(date)
}

export function formatNuevosRatio(ratio: string): {
  display: string
  ariaLabel?: string
} {
  const trimmed = ratio.trim()
  if (!trimmed) {
    return { display: "—", ariaLabel: "Ratio sin informar" }
  }
  return { display: `${trimmed}:1` }
}

export function cutoffIsoDayMonthsAgo(
  months: number,
  referenceDate = new Date(),
): string {
  const d = new Date(referenceDate)
  d.setUTCMonth(d.getUTCMonth() - months)
  return d.toISOString().slice(0, 10)
}

export function filterNuevosLast12Months(
  rows: NuevoCedearRow[],
  referenceDate = new Date(),
): NuevoCedearRow[] {
  const cutoff = cutoffIsoDayMonthsAgo(12, referenceDate)
  return rows.filter((row) => row.detectedSince >= cutoff)
}

export function isNuevoCedearBadge(
  detectedSince: string,
  referenceDate = new Date(),
): boolean {
  const detected = new Date(`${detectedSince}T12:00:00.000Z`)
  const ref = new Date(
    Date.UTC(
      referenceDate.getUTCFullYear(),
      referenceDate.getUTCMonth(),
      referenceDate.getUTCDate(),
      12,
    ),
  )
  const diffMs = ref.getTime() - detected.getTime()
  const diffDays = diffMs / (24 * 60 * 60 * 1000)
  return diffDays >= 0 && diffDays <= NUEVO_BADGE_DAYS
}

function monthGroupHeading(isoDay: string): string {
  const [y, m] = isoDay.split("-").map(Number)
  const date = new Date(Date.UTC(y, m - 1, 1, 12, 0, 0))
  const raw = monthYearFormatter.format(date)
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

export function groupNuevosCedearsByMonth(
  rows: NuevoCedearRow[],
): NuevosCedearMonthGroup[] {
  const groups = new Map<string, NuevoCedearRow[]>()
  for (const row of rows) {
    const key = row.detectedSince.slice(0, 7)
    const bucket = groups.get(key)
    if (bucket) bucket.push(row)
    else groups.set(key, [row])
  }

  return [...groups.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, bucket]) => {
      const heading = monthGroupHeading(`${key}-01`)
      const count = bucket.length
      return {
        id: `m-${key}`,
        heading,
        countLabel: `${count} ${count === 1 ? "alta" : "altas"}`,
        rows: bucket,
      }
    })
}

export function buildNuevosCedearsGroups(
  rows: NuevoCedearRow[],
): NuevosCedearMonthGroup[] {
  if (rows.length < GROUP_BY_MONTH_THRESHOLD) {
    return [
      {
        id: "nuevos-cedears-all",
        heading: "",
        countLabel: "",
        rows,
      },
    ]
  }
  return groupNuevosCedearsByMonth(rows)
}

export function nuevosCedearsNeedsStickySearch(rowCount: number): boolean {
  return rowCount > STICKY_SEARCH_THRESHOLD
}

export function filterNuevosCedearsQuery(
  rows: NuevoCedearRow[],
  query: string,
): NuevoCedearRow[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return rows
  return rows.filter((row) => {
    return (
      row.ticker.toLowerCase().includes(normalized) ||
      row.name.toLowerCase().includes(normalized)
    )
  })
}

export function nuevosCedearsUpdatedIsoDay(): string {
  return getNuevosCedearsDataset().generatedAt.slice(0, 10)
}

export function nuevosCedearsSitemapLastModified(): Date {
  const rows = filterNuevosLast12Months(getNuevosCedearsRows())
  const latestEntry = rows[0]?.detectedSince
  if (!latestEntry) {
    return new Date(getNuevosCedearsDataset().generatedAt)
  }
  const [y, m, d] = latestEntry.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

export function buildNuevosCedearsPageModel(referenceDate = new Date()) {
  const rows = filterNuevosLast12Months(getNuevosCedearsRows(), referenceDate)
  return {
    rows,
    groups: buildNuevosCedearsGroups(rows),
    count12Months: rows.length,
    updatedIsoDay: nuevosCedearsUpdatedIsoDay(),
    needsSearch: nuevosCedearsNeedsStickySearch(rows.length),
    referenceDate,
  }
}
