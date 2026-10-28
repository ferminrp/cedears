import { parseRatio } from "@/lib/cedears"
import { cedearYahooSymbol } from "@/lib/cedear-yahoo"
import {
  formatDateInEastern,
  type DividendFrequencyLabel,
} from "@/lib/dividend-display"
import { getCedears } from "@/lib/get-cedears"
import { getUnderlyingDividends } from "@/lib/underlying-dividends"
import { unstable_cache } from "next/cache"

const YAHOO_FETCH_CONCURRENCY = 8

export type CedearDividendRow = {
  cedear: string
  name: string
  market: string
  tickerOriginal: string
  ratio: string
  dividendYield: number | null
  dividendRateUsd: number | null
  estimatedCedearUsd: number | null
  frequency: DividendFrequencyLabel
  exDividendDate: string | null
  dividendPaymentDate: string | null
}

export type DividendsTableData = {
  rows: CedearDividendRow[]
  asOfDate: string
  loadFailed: boolean
}

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase()
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let index = 0

  async function worker() {
    while (index < items.length) {
      const current = index++
      results[current] = await fn(items[current])
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker(),
  )
  await Promise.all(workers)
  return results
}

function uniqueYahooSymbols(
  cedears: Awaited<ReturnType<typeof getCedears>>,
): string[] {
  const seen = new Set<string>()
  const symbols: string[] = []
  for (const cedear of cedears) {
    const symbol = normalizeSymbol(cedearYahooSymbol(cedear))
    if (!symbol || seen.has(symbol)) continue
    seen.add(symbol)
    symbols.push(symbol)
  }
  return symbols
}

function estimatedAnnualUsdPerCedear(
  rate: number | null,
  ratio: string,
): number | null {
  if (rate === null) return null
  const ratioValue = parseRatio(ratio)
  if (ratioValue === null) return null
  return rate / ratioValue
}

export async function getDividendsTableDataUncached(): Promise<DividendsTableData> {
  const asOfDate = formatDateInEastern(new Date())
  let cedears: Awaited<ReturnType<typeof getCedears>>
  try {
    cedears = await getCedears()
  } catch {
    return { rows: [], asOfDate, loadFailed: true }
  }

  const symbols = uniqueYahooSymbols(cedears)
  let loadFailed = false
  const snapshots = await mapWithConcurrency(
    symbols,
    YAHOO_FETCH_CONCURRENCY,
    async (symbol) => {
      const data = await getUnderlyingDividends(symbol)
      if (data === null) loadFailed = true
      return data
    },
  )

  const snapshotBySymbol = new Map<
    string,
    NonNullable<Awaited<ReturnType<typeof getUnderlyingDividends>>>
  >()
  symbols.forEach((symbol, i) => {
    const snap = snapshots[i]
    if (snap && snap.yield !== null && snap.yield > 0) {
      snapshotBySymbol.set(symbol, snap)
    }
  })

  const rows: CedearDividendRow[] = []

  for (const cedear of cedears) {
    const symbol = normalizeSymbol(cedearYahooSymbol(cedear))
    const snap = snapshotBySymbol.get(symbol)
    if (!snap) continue

    rows.push({
      cedear: cedear.Cedears,
      name: cedear.Name,
      market: cedear.Market,
      tickerOriginal: cedear.TickerOriginal,
      ratio: cedear.Ratio,
      dividendYield: snap.yield,
      dividendRateUsd: snap.rate,
      estimatedCedearUsd: estimatedAnnualUsdPerCedear(snap.rate, cedear.Ratio),
      frequency: snap.frequency,
      exDividendDate: snap.exDate,
      dividendPaymentDate: snap.payDate,
    })
  }

  rows.sort(compareByExDateAsc)

  return { rows, asOfDate, loadFailed: loadFailed && rows.length === 0 }
}

export const getDividendsTableData = unstable_cache(
  getDividendsTableDataUncached,
  ["dividends-table-v1"],
  { revalidate: 86400 },
)

export function compareByExDateAsc(a: CedearDividendRow, b: CedearDividendRow): number {
  const exA = a.exDividendDate ?? "9999-12-31"
  const exB = b.exDividendDate ?? "9999-12-31"
  const aMissing = a.exDividendDate === null
  const bMissing = b.exDividendDate === null
  if (aMissing && !bMissing) return 1
  if (!aMissing && bMissing) return -1
  if (exA !== exB) return exA.localeCompare(exB)
  return a.cedear.localeCompare(b.cedear)
}

export function filterDividendRows(
  rows: CedearDividendRow[],
  query: string,
): CedearDividendRow[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return rows
  return rows.filter(
    (row) =>
      row.cedear.toLowerCase().includes(normalized) ||
      row.name.toLowerCase().includes(normalized) ||
      row.tickerOriginal.toLowerCase().includes(normalized),
  )
}

export function filterDividendRowsByFrequency(
  rows: CedearDividendRow[],
  frequencyFilter: string | null,
): CedearDividendRow[] {
  if (!frequencyFilter || frequencyFilter === "todas") return rows
  if (frequencyFilter === "semestral-anual") {
    return rows.filter(
      (row) => row.frequency === "Semestral" || row.frequency === "Anual",
    )
  }
  const map: Record<string, DividendFrequencyLabel> = {
    mensual: "Mensual",
    trimestral: "Trimestral",
  }
  const target = map[frequencyFilter]
  if (!target) return rows
  return rows.filter((row) => row.frequency === target)
}

export function toDividendsCsv(rows: CedearDividendRow[]): string {
  const header =
    "Ticker,Empresa,Subyacente,Ratio,Yield,Frecuencia,ExDate,Pago,CobroEstimadoUSD\n"
  const lines = rows.map((row) => {
    const fields = [
      row.cedear,
      row.name,
      row.tickerOriginal,
      row.ratio,
      row.dividendYield !== null ? String(row.dividendYield) : "",
      row.frequency ?? "",
      row.exDividendDate ?? "",
      row.dividendPaymentDate ?? "",
      row.estimatedCedearUsd !== null ? String(row.estimatedCedearUsd) : "",
    ]
    return fields
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(",")
  })
  return header + lines.join("\n") + "\n"
}

export const DIVIDENDOS_PAGE_TITLE =
  "CEDEARs que pagan dividendos: yield y próximas fechas | CEDEARs Argentina"

export const DIVIDENDOS_PAGE_H1 = "CEDEARs que pagan dividendos"

export const DIVIDENDOS_INTRO =
  "Yield, frecuencia y próximas fechas de los subyacentes que pagan dividendos."

export const DIVIDENDOS_META_DESCRIPTION =
  "Lista de CEDEARs que pagan dividendos con yield, frecuencia y próximas fechas ex-dividendo y de pago. Cómo se cobran en Argentina."

export const DIVIDENDOS_HOW_IT_WORKS = [
  "El dividendo lo paga la empresa o el fondo en el exterior y llega en dólares a tu cuenta en la ALyC, en proporción a tu tenencia y al ratio del CEDEAR.",
  "Para cobrarlo tenés que tener el CEDEAR en cartera antes de la fecha ex-dividendo del subyacente.",
  "En origen (por ejemplo, Estados Unidos) suele aplicarse una retención típica del 30% sobre el dividendo bruto; el neto que ves en cuenta depende de tu situación y del broker.",
  "En Argentina, el tratamiento impositivo depende de tu caso: consultá con tu contador.",
  "Esto no es asesoramiento legal, impositivo ni financiero.",
] as const

export const DIVIDENDOS_FAQ = [
  {
    question: "¿Qué es la fecha ex-dividendo?",
    answer:
      "Es la fecha a partir de la cual quien compra el activo ya no tiene derecho al próximo dividendo. Para cobrarlo en un CEDEAR, tenés que figurar como tenedor antes de esa fecha (según las reglas de tu ALyC).",
  },
  {
    question: "¿En qué moneda cobro?",
    answer:
      "El flujo habitual es en dólares en tu cuenta local en Argentina, proporcional a la cantidad de CEDEARs y al ratio. No recibís la acción en el exterior.",
  },
  {
    question: "¿Cuánto cobro por CEDEAR?",
    answer:
      "De forma estimada, el dividendo anual en USD del subyacente dividido el ratio del CEDEAR (ver columna «Cobro est.»). El monto real por evento depende del calendario de pagos y de retenciones. Consultá también la tabla de ratios.",
  },
] as const
