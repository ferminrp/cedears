export type HistoricalBar = {
  date: string
  o: number
  h: number
  l: number
  c: number
  v: number
  dr: number
  sa: number
}

function isHistoricalBar(value: unknown): value is HistoricalBar {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as HistoricalBar).date === "string" &&
    typeof (value as HistoricalBar).c === "number" &&
    Number.isFinite((value as HistoricalBar).c)
  )
}

export async function getCedearHistorical(
  ticker: string,
): Promise<HistoricalBar[]> {
  const normalized = ticker.trim().toUpperCase()
  const res = await fetch(
    `https://data912.com/historical/cedears/${encodeURIComponent(normalized)}`,
    { next: { revalidate: 3600 } },
  )

  if (!res.ok) {
    return []
  }

  const data: unknown = await res.json()
  if (!Array.isArray(data)) {
    return []
  }

  return data.filter(isHistoricalBar)
}
