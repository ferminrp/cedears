import { requestHost } from "@/lib/request-host"

const DEFAULT_PRODUCTION_ORIGIN = "https://cedears.com"

/** Apex origin for www→apex redirects (never a dev / workers.dev URL). */
export function trustedApexOrigin(siteUrl?: string): string {
  for (const candidate of [
    siteUrl,
    process.env.NEXT_PUBLIC_SITE_URL,
    DEFAULT_PRODUCTION_ORIGIN,
  ]) {
    const trimmed = candidate?.replace(/\/$/, "")
    if (!trimmed) continue
    try {
      const { hostname, protocol } = new URL(trimmed)
      if (hostname === "cedears.com" && protocol === "https:") return trimmed
    } catch {
      continue
    }
  }
  return DEFAULT_PRODUCTION_ORIGIN
}

function resolveConfiguredSiteUrl(siteUrl?: string): string | null {
  for (const candidate of [
    siteUrl,
    process.env.NEXT_PUBLIC_SITE_URL,
    DEFAULT_PRODUCTION_ORIGIN,
  ]) {
    const trimmed = candidate?.replace(/\/$/, "")
    if (trimmed) return trimmed
  }
  return null
}

export function siteOriginForRequest(
  request: Request,
  siteUrl?: string,
): string {
  const configured = resolveConfiguredSiteUrl(siteUrl)
  if (configured) return configured
  const url = new URL(request.url)
  const host = requestHost(request.headers, url).replace(/^www\./, "")
  return `https://${host}`
}

function isWwwHost(request: Request): boolean {
  const url = new URL(request.url)
  const host = requestHost(request.headers, url)
  if (host.startsWith("www.")) return true
  return url.hostname.startsWith("www.")
}

/**
 * Permanent redirect from www → apex (path + query preserved).
 * Responses are not cacheable so a www 301 cannot pollute the Workers cache
 * entry used for apex HTML.
 */
export function buildWwwToApexRedirect(
  request: Request,
  options?: { siteUrl?: string },
): Response | null {
  if (!isWwwHost(request)) return null

  const url = new URL(request.url)
  // Always target production apex; never derive from the request URL (dev host) or
  // Workers-local NEXT_PUBLIC overrides.
  const location = `${DEFAULT_PRODUCTION_ORIGIN}${url.pathname}${url.search}`

  return new Response(null, {
    status: 301,
    headers: {
      Location: location,
      "Cache-Control": "no-store",
    },
  })
}
