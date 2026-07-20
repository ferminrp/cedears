import { type CedearBase, getCedearBases } from "@/lib/cedears"

const EARNINGS_API_URL =
  "https://api.savvytrader.com/pricing/assets/earnings/calendar/daily"

export type EarningsEvent = {
  symbol: string
  earningsDate: string
  earningsTime: string | null
  isDateConfirmed: boolean
}

export type CedearEarnings = {
  cedear: string
  name: string
  market: string
  tickerOriginal: string
  earningsTime: string | null
  isDateConfirmed: boolean
}

export type EarningsDay = {
  date: string
  items: CedearEarnings[]
}

export type EarningsTimeline = {
  days: EarningsDay[]
  totalCedears: number
  dateRange: { start: string; end: string }
}

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function parseEarningsEvent(value: unknown): EarningsEvent | null {
  if (!isRecord(value) || typeof value.symbol !== "string") {
    return null
  }

  const earningsDate =
    typeof value.earningsDate === "string" ? value.earningsDate : null
  if (!earningsDate) return null

  return {
    symbol: value.symbol,
    earningsDate,
    earningsTime:
      typeof value.earningsTime === "string" ? value.earningsTime : null,
    isDateConfirmed: value.isDateConfirmed === true,
  }
}

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

function compareEarningsTime(a: string | null, b: string | null): number {
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1
  return a.localeCompare(b)
}

export async function fetchEarningsCalendar(
  start: string,
  end: string,
): Promise<Map<string, EarningsEvent[]>> {
  const url = new URL(EARNINGS_API_URL)
  url.searchParams.set("start", start)
  url.searchParams.set("end", end)

  const res = await fetch(url, {
    headers: {
      accept: "application/json",
      "x-earningshub-client": "web",
      "x-earningshub-client-build": "284",
    },
    next: { revalidate: 3600 },
  })

  if (!res.ok) {
    throw new Error(
      `No se pudo obtener el calendario de earnings (HTTP ${res.status})`,
    )
  }

  const data: unknown = await res.json()
  if (!isRecord(data)) {
    throw new Error("Calendario de earnings inválido")
  }

  const bySymbol = new Map<string, EarningsEvent[]>()

  for (const [date, events] of Object.entries(data)) {
    if (!Array.isArray(events)) continue

    for (const raw of events) {
      const event = parseEarningsEvent(raw)
      if (!event) continue

      const symbol = normalizeSymbol(event.symbol)
      const existing = bySymbol.get(symbol) ?? []
      existing.push({ ...event, earningsDate: date })
      bySymbol.set(symbol, existing)
    }
  }

  return bySymbol
}

function buildCedearMap(
  cedears: CedearBase[],
): Map<string, CedearBase[]> {
  const map = new Map<string, CedearBase[]>()

  for (const cedear of cedears) {
    const symbol = normalizeSymbol(cedear.TickerOriginal)
    const existing = map.get(symbol) ?? []
    existing.push(cedear)
    map.set(symbol, existing)
  }

  return map
}

function mergeEarningsWithCedears(
  calendar: Map<string, EarningsEvent[]>,
  cedears: CedearBase[],
): EarningsDay[] {
  const cedearMap = buildCedearMap(cedears)
  const days = new Map<string, CedearEarnings[]>()

  for (const [symbol, events] of calendar) {
    const matchingCedears = cedearMap.get(symbol)
    if (!matchingCedears) continue

    for (const event of events) {
      const dayItems = days.get(event.earningsDate) ?? []

      for (const cedear of matchingCedears) {
        dayItems.push({
          cedear: cedear.Cedears,
          name: cedear.Name,
          market: cedear.Market,
          tickerOriginal: cedear.TickerOriginal,
          earningsTime: event.earningsTime,
          isDateConfirmed: event.isDateConfirmed,
        })
      }

      days.set(event.earningsDate, dayItems)
    }
  }

  return [...days.entries()]
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, items]) => ({
      date,
      items: items.sort((a, b) => {
        const byTime = compareEarningsTime(a.earningsTime, b.earningsTime)
        if (byTime !== 0) return byTime
        return a.cedear.localeCompare(b.cedear)
      }),
    }))
}

export async function getEarningsTimeline(): Promise<EarningsTimeline> {
  const today = new Date()
  const start = formatDate(today)
  const end = formatDate(addMonths(today, 3))

  const [calendar, cedears] = await Promise.all([
    fetchEarningsCalendar(start, end),
    getCedearBases(),
  ])

  const days = mergeEarningsWithCedears(calendar, cedears)
  const totalCedears = new Set(
    days.flatMap((day) => day.items.map((item) => item.cedear)),
  ).size

  return {
    days,
    totalCedears,
    dateRange: { start, end },
  }
}
