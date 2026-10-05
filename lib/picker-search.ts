export type SearchableAsset = {
  ticker: string
  name: string
}

/**
 * Rank matches so Enter picks the most likely ticker: exact, then prefix,
 * then substring (ticker or name). Selected tickers are omitted.
 */
export function rankPickerResults<T extends SearchableAsset>(
  assets: readonly T[],
  query: string,
  selected: ReadonlySet<string>,
  limit = 8,
): T[] {
  const q = query.trim().toLowerCase()
  if (q === "") return []

  const rank = (ticker: string) => {
    const t = ticker.toLowerCase()
    if (t === q) return 0
    if (t.startsWith(q)) return 1
    return 2
  }

  return assets
    .filter(
      (asset) =>
        !selected.has(asset.ticker) &&
        (asset.ticker.toLowerCase().includes(q) ||
          asset.name.toLowerCase().includes(q)),
    )
    .map((asset, index) => ({ asset, index, rank: rank(asset.ticker) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .slice(0, limit)
    .map(({ asset }) => asset)
}
