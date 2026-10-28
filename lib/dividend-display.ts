const ET_TIMEZONE = "America/New_York"

export type DividendFrequencyLabel =
  | "Mensual"
  | "Trimestral"
  | "Semestral"
  | "Anual"
  | null

export function formatDateInEastern(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ET_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

export function yahooDateToIsoDate(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatDateInEastern(value)
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return formatDateInEastern(new Date(value * 1000))
  }
  return null
}

export function pickUpcomingIsoDate(
  candidates: (string | null)[],
  todayIso: string,
): string | null {
  const valid = candidates.filter((d): d is string => Boolean(d))
  const upcoming = valid.filter((d) => d >= todayIso).sort()
  return upcoming[0] ?? null
}

export function inferFrequencyFromPaymentCount(count: number): DividendFrequencyLabel {
  if (count >= 10) return "Mensual"
  if (count >= 3 && count <= 5) return "Trimestral"
  if (count === 2) return "Semestral"
  if (count === 1) return "Anual"
  return null
}

export function countDividendsInLast12Months(
  dividendDatesIso: string[],
  todayIso: string,
): number {
  const [y, m, d] = todayIso.split("-").map(Number)
  const yearAgo = new Date(Date.UTC(y, m - 1, d))
  yearAgo.setUTCFullYear(yearAgo.getUTCFullYear() - 1)
  const cutoff = formatDateInEastern(yearAgo)
  return dividendDatesIso.filter((iso) => iso >= cutoff && iso <= todayIso).length
}

const yieldPercentFormatter = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

export function formatUnderlyingYieldPercent(yieldDecimal: number | null): string {
  if (yieldDecimal === null || !Number.isFinite(yieldDecimal)) return "—"
  return `${yieldPercentFormatter.format(yieldDecimal * 100)} %`
}

export function formatShortDividendDate(iso: string | null, today = new Date()): string {
  if (!iso) return "sin fecha"
  const [year, month, day] = iso.split("-").map(Number)
  const pad = (n: number) => String(n).padStart(2, "0")
  if (year === today.getFullYear()) {
    return `${pad(day)}/${pad(month)}`
  }
  return `${pad(day)}/${pad(month)}/${year}`
}

export function formatFrequencyShort(
  frequency: DividendFrequencyLabel,
): string {
  if (!frequency) return "—"
  if (frequency === "Trimestral") return "Trim."
  if (frequency === "Semestral") return "Sem."
  if (frequency === "Anual") return "Anual"
  return frequency
}

const usdFormatter = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatEstimatedCedearUsd(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—"
  return `USD ${usdFormatter.format(value)}`
}

export function formatDividendosUpdatedDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number)
  const date = new Date(year, month - 1, day)
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).format(date)
}
