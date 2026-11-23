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

function hostnameWithoutPort(host: string): string {
  if (host.startsWith("[")) return host
  const sep = host.lastIndexOf(":")
  if (sep > 0 && /^\d+$/.test(host.slice(sep + 1))) return host.slice(0, sep)
  return host
}

export function isProductionCedearsHost(host: string): boolean {
  const bare = hostnameWithoutPort(host)
  return bare === "cedears.com" || bare === "www.cedears.com"
}

/**
 * Origin for middleware absolute redirects (ticker case, slugs, /mcp-docs, …).
 * Preview and local keep the incoming host; production apex/www keep trusted https://cedears.com.
 */
export function middlewareRedirectOrigin(
  headers: Headers,
  url: URL,
  siteUrl?: string,
  options?: { forceHttps?: boolean },
): string {
  const requestHostHeader = requestHost(headers, url)
  // Classify production from the request URL hostname (not spoofable x-forwarded-host).
  if (isProductionCedearsHost(url.hostname)) {
    return trustedApexOrigin(siteUrl)
  }
  if (options?.forceHttps) {
    return `https://${requestHostHeader}`
  }
  const forwarded = headers.get("x-forwarded-proto")
  const proto = forwarded ?? (url.protocol === "https:" ? "https" : "http")
  return `${proto}://${requestHostHeader}`
}

export function siteOriginForRequest(
  request: Request,
  siteUrl?: string,
): string {
  const url = new URL(request.url)
  return middlewareRedirectOrigin(request.headers, url, siteUrl)
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
