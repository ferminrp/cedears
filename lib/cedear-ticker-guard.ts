import { buildCedearTickerSet } from "@/lib/cedear-ticker-set"
import { getCedearBases } from "@/lib/get-cedears"

let cachedTickers: { set: Set<string>; expiresAt: number } | null = null
const CACHE_MS = 5 * 60 * 1000

export async function getKnownCedearTickerSet(): Promise<Set<string>> {
  const now = Date.now()
  if (cachedTickers && cachedTickers.expiresAt > now) {
    return cachedTickers.set
  }
  const bases = await getCedearBases()
  const set = buildCedearTickerSet(bases)
  cachedTickers = { set, expiresAt: now + CACHE_MS }
  return set
}

export async function isKnownCedearTicker(ticker: string): Promise<boolean> {
  const normalized = ticker.trim().toUpperCase()
  if (!normalized) return false
  return getKnownCedearTickerSet().then((set) => set.has(normalized))
}
