import type { CedearBase } from "@/lib/get-cedears"
import { slugifyTag } from "@/lib/cedear-tags"

/** Last content change per static route (from git history at generation time). */
export const STATIC_ROUTE_LASTMOD: Readonly<Record<string, string>> = {
  "/": "2026-10-07T12:27:58.000Z",
  "/dolar-mep": "2026-10-07T12:27:58.000Z",
  "/dolar-cable": "2026-10-07T12:27:58.000Z",
  "/earnings": "2026-10-07T12:27:58.000Z",
  "/dividendos": "2026-10-28T00:00:00.000Z",
  "/categorias": "2026-10-07T12:27:58.000Z",
  "/herramientas": "2026-10-07T12:27:58.000Z",
  "/herramientas/rebalanceo": "2026-10-07T12:27:58.000Z",
  "/herramientas/dca": "2026-10-07T12:27:58.000Z",
  "/alycs": "2026-10-07T12:27:58.000Z",
  "/llms.txt": "2026-10-07T12:27:58.000Z",
}

function parseIsoDate(value: string | undefined): Date | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

export function cedearLastModified(base: CedearBase): Date {
  const fromMeta = parseIsoDate(base.yfinanceFetchedAt)
  if (fromMeta) return fromMeta
  return new Date(STATIC_ROUTE_LASTMOD["/"])
}

export function maxLastModified(dates: Date[]): Date {
  if (dates.length === 0) return new Date(STATIC_ROUTE_LASTMOD["/"])
  return new Date(Math.max(...dates.map((d) => d.getTime())))
}

export function categoryLastModified(
  bases: CedearBase[],
  tag: string,
): Date {
  const slug = slugifyTag(tag)
  const matching = bases.filter((c) =>
    c.tags.some((t) => slugifyTag(t) === slug),
  )
  return maxLastModified(matching.map(cedearLastModified))
}

export function dataFeedLastModified(bases: CedearBase[]): Date {
  return maxLastModified(bases.map(cedearLastModified))
}

export function staticRouteLastModified(path: string): Date {
  const iso = STATIC_ROUTE_LASTMOD[path]
  return iso ? new Date(iso) : new Date(STATIC_ROUTE_LASTMOD["/"])
}
