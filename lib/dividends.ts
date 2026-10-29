import { cedearYahooSymbol } from "@/lib/cedear-yahoo"
import { formatDateInEastern } from "@/lib/dividend-display"
import {
  type CedearDividendRow,
  type DividendsTableData,
  compareByExDateAsc,
  estimatedAnnualUsdPerCedear,
} from "@/lib/dividends-shared"
import { getCedears } from "@/lib/get-cedears"
import { getUnderlyingDividends } from "@/lib/underlying-dividends"
import { unstable_cache } from "next/cache"

export type { CedearDividendRow, DividendsTableData } from "@/lib/dividends-shared"
export {
  DIVIDENDOS_FAQ,
  DIVIDENDOS_HOW_IT_WORKS,
  DIVIDENDOS_INTRO,
  DIVIDENDOS_META_DESCRIPTION,
  DIVIDENDOS_PAGE_H1,
  DIVIDENDOS_PAGE_TITLE,
  filterDividendRows,
  filterDividendRowsByFrequency,
  estimatedAnnualUsdPerCedear,
  toDividendsCsv,
} from "@/lib/dividends-shared"

const YAHOO_FETCH_CONCURRENCY = 8

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
