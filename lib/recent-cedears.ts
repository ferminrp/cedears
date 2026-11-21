/** Tickers visited on /cedear/[ticker], newest first. Browser-only (localStorage). */

export const RECENT_CEDEARS_STORAGE_KEY = "cedears-recent"
export const RECENT_CEDEARS_LIMIT = 5

const TICKER_PATTERN = /^[A-Z0-9.\-]{1,12}$/

export function normalizeRecentCedears(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const item of value) {
    if (typeof item !== "string") continue
    const ticker = item.trim().toUpperCase()
    if (!TICKER_PATTERN.test(ticker) || seen.has(ticker)) continue
    seen.add(ticker)
    out.push(ticker)
    if (out.length >= RECENT_CEDEARS_LIMIT) break
  }
  return out
}

export function readRecentCedears(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_CEDEARS_STORAGE_KEY)
    return stored ? normalizeRecentCedears(JSON.parse(stored)) : []
  } catch {
    return []
  }
}

export function pushRecentCedear(ticker: string): void {
  try {
    const next = normalizeRecentCedears([ticker, ...readRecentCedears()])
    localStorage.setItem(RECENT_CEDEARS_STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Storage blocked (private mode, quota): recents are a convenience only.
  }
}
