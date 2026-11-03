import { unstable_cache } from "next/cache"
import { formatDateInEastern } from "@/lib/dividend-display"
import type { DividendsTableData } from "@/lib/dividends-shared"

class DividendsLoadFailedError extends Error {}

/**
 * unstable_cache stores whatever the loader returns, so a failed load must throw
 * to stay out of the cache. On a background refresh vinext then keeps serving the
 * previous good entry; on a cold miss the caller gets a failed result that the page
 * renders uncached.
 */
export function cacheDividendsTable(
  load: () => Promise<DividendsTableData>,
  keyParts: string[],
  revalidateSeconds: number,
): () => Promise<DividendsTableData> {
  const cached = unstable_cache(
    async () => {
      const data = await load()
      if (data.loadFailed) throw new DividendsLoadFailedError()
      return data
    },
    keyParts,
    { revalidate: revalidateSeconds },
  )

  return async () => {
    try {
      return await cached()
    } catch (error) {
      if (!(error instanceof DividendsLoadFailedError)) {
        console.error("No se pudo cargar la tabla de dividendos", { error })
      }
      return { rows: [], asOfDate: formatDateInEastern(new Date()), loadFailed: true }
    }
  }
}
