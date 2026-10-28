import { getSiteUrl } from "@/lib/site"

/** Absolute https://cedears.com/... URL for rel=canonical and og:url. */
export function absoluteCanonical(path: string): string {
  const base = getSiteUrl().replace(/\/$/, "")
  const normalized = path.startsWith("/") ? path : `/${path}`
  return `${base}${normalized}`
}
