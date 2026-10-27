function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function parseYfinanceFetchedAtMs(value: unknown): number | null {
  if (!isRecord(value)) return null
  const meta = value["yfinance-metadata"]
  if (!isRecord(meta) || typeof meta.fetched_at !== "string") return null
  const ms = Date.parse(meta.fetched_at)
  return Number.isFinite(ms) ? ms : null
}

export function latestYfinanceFetchedAtFromRecords(
  records: unknown[],
): Date | null {
  let latestMs: number | null = null
  for (const record of records) {
    const ms = parseYfinanceFetchedAtMs(record)
    if (ms === null) continue
    latestMs = latestMs === null ? ms : Math.max(latestMs, ms)
  }
  return latestMs === null ? null : new Date(latestMs)
}
