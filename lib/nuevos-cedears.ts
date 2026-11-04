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

export const NUEVOS_CEDEARS_ALTA_INTRO =
  "Una alta es cuando BYMA suma un CEDEAR nuevo al mercado local: desde entonces podés operarlo en pesos y se publica su ratio de conversión inicial."

export const NUEVOS_CEDEARS_INFERRED_NOTE =
  "Las fechas de alta son inferidas: marcan la primera aparición de cada ticker en el historial del listado público google-sheets-argento. No reemplazan un comunicado oficial de BYMA."

export const NUEVOS_CEDEARS_FAQ: ReadonlyArray<{
  question: string
  answer: string
}> = [
  {
    question: "¿Cada cuánto se listan CEDEARs nuevos en BYMA?",
    answer:
      "No hay un calendario fijo. BYMA publica altas cuando el emisor y el depositario completan el proceso; suelen ser pocas por mes y a veces llegan en tandas temáticas (ETFs, commodities, etc.).",
  },
  {
    question: "¿De dónde salen las fechas de esta página?",
    answer:
      "Las inferimos del historial de actualizaciones del listado público google-sheets-argento (primera vez que aparece cada ticker). Si necesitás la fecha oficial, consultá los comunicados de BYMA.",
  },
  {
    question: "¿El ratio puede cambiar después del alta?",
    answer:
      "El ratio de un CEDEAR es estable: indica cuántos certificados equivalen a una acción del subyacente. Si BYMA anuncia un ajuste, se refleja en el listado; esta tabla muestra el ratio vigente del dataset.",
  },
]

export const BULK_INFERENCE_DAY_THRESHOLD = 15
export const NUEVOS_LIST_WINDOW_MONTHS = 6
export const NUEVOS_VISIBLE_MAX = 30

const GROUP_BY_MONTH_THRESHOLD = 8
const NUEVO_BADGE_DAYS = 7

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

export function buildTickerCountsByDay(
  rows: NuevoCedearRow[],
): Map<string, number> {
  const counts = new Map<string, number>()
  for (const row of rows) {
    counts.set(row.detectedSince, (counts.get(row.detectedSince) ?? 0) + 1)
  }
  return counts
}

export function isBulkInferenceDay(
  isoDay: string,
  countsByDay: Map<string, number>,
): boolean {
  return (countsByDay.get(isoDay) ?? 0) > BULK_INFERENCE_DAY_THRESHOLD
}

/** Drops days with >15 tickers (backfill), unless BYMA confirms (none wired yet). */
export function excludeBulkInferenceDays(
  rows: NuevoCedearRow[],
  allEntries = getNuevosCedearsRows(),
): NuevoCedearRow[] {
  const countsByDay = buildTickerCountsByDay(allEntries)
  return rows.filter(
    (row) => !isBulkInferenceDay(row.detectedSince, countsByDay),
  )
}

export function filterNuevosInWindow(
  rows: NuevoCedearRow[],
  referenceDate = new Date(),
  months = NUEVOS_LIST_WINDOW_MONTHS,
): NuevoCedearRow[] {
  const cutoff = cutoffIsoDayMonthsAgo(months, referenceDate)
  return rows.filter((row) => row.detectedSince >= cutoff)
}

export function buildQualifiedNuevosRows(
  referenceDate = new Date(),
): NuevoCedearRow[] {
  const all = getNuevosCedearsRows()
  return excludeBulkInferenceDays(filterNuevosInWindow(all, referenceDate), all)
}

export function buildOlderQualifiedNuevosRows(
  referenceDate = new Date(),
): NuevoCedearRow[] {
  const all = getNuevosCedearsRows()
  const allQualified = excludeBulkInferenceDays(all, all)
  const cutoff = cutoffIsoDayMonthsAgo(NUEVOS_LIST_WINDOW_MONTHS, referenceDate)
  return allQualified.filter((row) => row.detectedSince < cutoff)
}

export function splitNuevosVisibleRows(
  rows: NuevoCedearRow[],
  max = NUEVOS_VISIBLE_MAX,
): { visible: NuevoCedearRow[]; hidden: NuevoCedearRow[] } {
  return {
    visible: rows.slice(0, max),
    hidden: rows.slice(max),
  }
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

export function nuevosCedearsUpdatedIsoDay(): string {
  return getNuevosCedearsDataset().generatedAt.slice(0, 10)
}

export function nuevosCedearsSitemapLastModified(): Date {
  const rows = buildQualifiedNuevosRows()
  const latestEntry = rows[0]?.detectedSince
  if (!latestEntry) {
    return new Date(getNuevosCedearsDataset().generatedAt)
  }
  const [y, m, d] = latestEntry.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

export function buildNuevosCedearsPageModel(referenceDate = new Date()) {
  const qualified = buildQualifiedNuevosRows(referenceDate)
  const olderQualified = buildOlderQualifiedNuevosRows(referenceDate)
  const { visible, hidden } = splitNuevosVisibleRows(qualified)
  const expandedGroups = buildNuevosCedearsGroups(qualified)
  const countLabelByGroupId = new Map(
    expandedGroups.map((group) => [group.id, group.countLabel]),
  )
  const groups = buildNuevosCedearsGroups(visible).map((group) => ({
    ...group,
    countLabel: countLabelByGroupId.get(group.id) ?? group.countLabel,
  }))

  return {
    qualifiedRows: qualified,
    olderRows: olderQualified,
    rows: visible,
    hiddenCount: hidden.length,
    olderCount: olderQualified.length,
    archiveCount: hidden.length + olderQualified.length,
    groups,
    expandedGroups,
    olderGroups: buildNuevosCedearsGroups(olderQualified),
    count6Months: qualified.length,
    updatedIsoDay: nuevosCedearsUpdatedIsoDay(),
    referenceDate,
  }
}
