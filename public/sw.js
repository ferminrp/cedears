/*
 * cedears.com service worker. Hand-written, no build step, no dependencies.
 * Registered from components/pwa/service-worker-registration.tsx (production only).
 * Served from public/ as a static asset; public/_headers sets Cache-Control: no-cache.
 *
 * Conservative on purpose: a stale-forever bug is worse than no SW.
 * - HTML navigations: network-first with a short timeout, then the cached copy
 *   of that exact URL, then the precached /offline (public/offline.html).
 * - vinext RSC payloads (`?_rsc=` + `RSC: 1`): network-first; on network error
 *   only, a cached copy of that exact `_rsc` URL. Otherwise the fetch fails and
 *   vinext falls back to a full-page navigation (which hits the HTML path above).
 *   Prefetches are never cached nor served from cache.
 * - Hashed build assets (/_next/static/*) and fonts: cache-first.
 * - Icons and the manifest: stale-while-revalidate.
 * - Everything else (APIs, MCP, data files, cross-origin, non-GET, markdown/JSON
 *   content negotiation) is not intercepted at all.
 *
 * Cache names carry SW_VERSION. Bump it when the caching rules change: activate
 * deletes every cedears-* cache that does not match, so pages and the hashed
 * assets they reference are dropped together (never HTML without its assets).
 * Normal deploys do not change this file, so cached pages keep their assets.
 */

/* eslint-disable no-restricted-globals */

const SW_VERSION = "v1"
const CACHE_PREFIX = "cedears-"
const CACHE_NAMES = {
  precache: CACHE_PREFIX + "precache-" + SW_VERSION,
  pages: CACHE_PREFIX + "pages-" + SW_VERSION,
  rsc: CACHE_PREFIX + "rsc-" + SW_VERSION,
  static: CACHE_PREFIX + "static-" + SW_VERSION,
  icons: CACHE_PREFIX + "icons-" + SW_VERSION,
}
const CACHE_LIMITS = { pages: 40, rsc: 40, static: 300, icons: 20 }
// public/offline.html; Workers static assets serve it at /offline (the .html URL redirects).
const OFFLINE_URL = "/offline"
const NAVIGATION_TIMEOUT_MS = 3500
const FETCHED_AT_HEADER = "x-cedears-fetched-at"

const BYPASS_PATHS = new Set([
  "/mcp",
  "/mcp-docs",
  "/mcp-well-known",
  "/api-catalog",
  "/cedears.json",
  "/cedears.csv",
  "/cedears.md",
  "/dividendos.csv",
  "/ratios.csv",
  "/llms.txt",
  "/sitemap.xml",
  "/robots.txt",
  "/sw.js",
])
const BYPASS_PREFIXES = ["/api/", "/mcp/", "/.well-known/", "/__vinext/"]
const ICON_PATH = /^\/(?:icon|apple-icon)(?:\d*)(?:\.\w+)?$|^\/pwa\/|^\/manifest\.webmanifest$|^\/favicon\.ico$/

/**
 * Pure routing decision. Exposed as a top-level function so tests can evaluate
 * this file in a VM and call it directly (tests/service-worker.test.ts).
 *
 * @param {{ method: string, url: string, origin: string, mode?: string,
 *           accept?: string | null, rsc?: string | null, prefetch?: boolean }} req
 * @returns {"bypass" | "navigate" | "rsc" | "static" | "icon"}
 */
function classifyRequest(req) {
  if (req.method !== "GET") return "bypass"
  let url
  try {
    url = new URL(req.url)
  } catch (_) {
    return "bypass"
  }
  if (url.origin !== req.origin) return "bypass"

  const path = url.pathname
  if (BYPASS_PATHS.has(path)) return "bypass"
  for (const prefix of BYPASS_PREFIXES) {
    if (path.startsWith(prefix)) return "bypass"
  }
  if (/\.(?:json|csv|md|txt|xml)$/i.test(path)) return "bypass"

  const accept = (req.accept || "").toLowerCase()
  // Content negotiation (middleware.ts rewrites `/` to markdown by Accept):
  // anything asking for markdown/JSON/plain text is never touched.
  if (/text\/markdown|text\/x-markdown|application\/json|text\/plain/.test(accept)) {
    return "bypass"
  }

  const isRsc =
    req.rsc === "1" ||
    url.searchParams.has("_rsc") ||
    path.endsWith(".rsc") ||
    accept.includes("text/x-component")
  if (isRsc) {
    // Prefetches are speculative; caching them risks replaying partial payloads.
    if (req.prefetch) return "bypass"
    if (req.mode === "navigate") return "bypass"
    return "rsc"
  }

  if (req.mode === "navigate") {
    return accept.includes("text/html") ? "navigate" : "bypass"
  }

  if (path.startsWith("/_next/static/") || path.startsWith("/fonts/")) return "static"
  if (ICON_PATH.test(path)) return "icon"
  return "bypass"
}

/** Cache key for a page: same origin + path + query, never the fragment. */
function pageCacheKey(rawUrl) {
  const url = new URL(rawUrl)
  url.hash = ""
  return url.href
}

function isCacheableHtml(response) {
  if (!response || response.status !== 200 || response.type !== "basic") return false
  if (response.redirected) return false
  const type = response.headers.get("content-type") || ""
  return type.toLowerCase().includes("text/html")
}

function isCacheableRsc(response) {
  if (!response || response.status !== 200 || response.type !== "basic") return false
  if (response.redirected) return false
  const type = response.headers.get("content-type") || ""
  return type.toLowerCase().startsWith("text/x-component")
}

function isCacheableAsset(response) {
  return Boolean(response) && response.status === 200 && response.type === "basic" && !response.redirected
}

// ---------------------------------------------------------------------------
// Worker runtime (skipped when this file is evaluated by unit tests).
// ---------------------------------------------------------------------------

if (typeof self !== "undefined" && typeof self.addEventListener === "function" && typeof caches !== "undefined") {
  /**
   * Last fetch time of the page shown in each tab, so the offline banner can
   * say when its prices were fetched. Key: `${clientId}|${pathname}`; `*|` keeps
   * the latest per pathname for browsers without FetchEvent.resultingClientId.
   */
  const pageMeta = new Map()
  const PAGE_META_LIMIT = 300

  const recordMeta = (clientId, rawUrl, fetchedAt, fromCache) => {
    const pathname = new URL(rawUrl).pathname
    const value = { fetchedAt, fromCache }
    if (clientId) pageMeta.set(clientId + "|" + pathname, value)
    pageMeta.set("*|" + pathname, value)
    while (pageMeta.size > PAGE_META_LIMIT) {
      pageMeta.delete(pageMeta.keys().next().value)
    }
  }

  const fetchedAtOf = (response) => {
    const raw = response.headers.get(FETCHED_AT_HEADER)
    const n = raw ? Number(raw) : NaN
    return Number.isFinite(n) ? n : null
  }

  /** Copy of the response with the fetch time stamped as a header. */
  const stamp = (response, fetchedAt) => {
    const headers = new Headers(response.headers)
    headers.set(FETCHED_AT_HEADER, String(fetchedAt))
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  }

  const trimCache = async (name, limit) => {
    const cache = await caches.open(name)
    const keys = await cache.keys()
    // keys() is in insertion order; re-put entries move to the end.
    for (let i = 0; i < keys.length - limit; i++) {
      await cache.delete(keys[i])
    }
  }

  const putFresh = async (cacheName, limit, key, response, fetchedAt) => {
    const cache = await caches.open(cacheName)
    await cache.delete(key, { ignoreVary: true })
    await cache.put(key, stamp(response, fetchedAt))
    await trimCache(cacheName, limit)
  }

  const offlineFallback = async () => {
    const cached = await caches.match(OFFLINE_URL, { cacheName: CACHE_NAMES.precache, ignoreVary: true })
    // Rebuild the response so a redirected precache entry can never be handed to a navigation.
    if (cached) {
      return new Response(cached.body, {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
      })
    }
    return new Response(
      "<!doctype html><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'><title>Sin conexión</title><p>Sin conexión. <a href='/'>Ir al listado</a>",
      { status: 503, headers: { "content-type": "text/html; charset=utf-8" } },
    )
  }

  const handleNavigation = async (event) => {
    const request = event.request
    const key = pageCacheKey(request.url)
    const clientId = event.resultingClientId || ""
    const startedAt = Date.now()

    const network = fetch(request).then((response) => {
      if (isCacheableHtml(response)) {
        event.waitUntil(
          putFresh(CACHE_NAMES.pages, CACHE_LIMITS.pages, key, response.clone(), startedAt).catch(() => {}),
        )
      }
      return response
    })
    // Avoid an unhandled rejection when the timeout wins and the network fails later.
    network.catch(() => {})

    const fromCache = async () => {
      const cached = await caches.match(key, { cacheName: CACHE_NAMES.pages, ignoreVary: true })
      if (!cached) return null
      recordMeta(clientId, request.url, fetchedAtOf(cached), true)
      return cached
    }

    let timer
    const timeout = new Promise((resolve) => {
      timer = setTimeout(() => resolve("timeout"), NAVIGATION_TIMEOUT_MS)
    })

    try {
      const first = await Promise.race([network, timeout])
      if (first !== "timeout") {
        clearTimeout(timer)
        if (isCacheableHtml(first)) {
          recordMeta(clientId, request.url, startedAt, false)
          return first
        }
        const cachedOnError = await fromCache()
        if (cachedOnError) return cachedOnError
        recordMeta(clientId, request.url, startedAt, false)
        return first
      }
      // Slow network: serve the saved copy if there is one, else keep waiting.
      const cached = await fromCache()
      if (cached) return cached
      const response = await network
      recordMeta(clientId, request.url, startedAt, false)
      return response
    } catch (_) {
      clearTimeout(timer)
      const cached = await fromCache()
      if (cached) return cached
      return offlineFallback()
    }
  }

  const handleRsc = async (event) => {
    const request = event.request
    const clientId = event.clientId || ""
    const startedAt = Date.now()
    try {
      const response = await fetch(request)
      if (isCacheableRsc(response)) {
        event.waitUntil(
          putFresh(CACHE_NAMES.rsc, CACHE_LIMITS.rsc, request.url, response.clone(), startedAt).catch(() => {}),
        )
        recordMeta(clientId, request.url, startedAt, false)
      }
      return response
    } catch (_) {
      // Exact `_rsc` URL only: the hash covers the router-state headers, so a
      // hit is a payload vinext asked for. On a miss, fail the fetch: vinext
      // then does a full-page navigation, which the navigation handler serves.
      const cached = await caches.match(request.url, { cacheName: CACHE_NAMES.rsc, ignoreVary: true })
      if (cached) {
        recordMeta(clientId, request.url, fetchedAtOf(cached), true)
        return cached
      }
      return Response.error()
    }
  }

  const handleStatic = async (event) => {
    const request = event.request
    const cached = await caches.match(request, { cacheName: CACHE_NAMES.static, ignoreVary: true })
    if (cached) return cached
    const response = await fetch(request)
    if (isCacheableAsset(response)) {
      const copy = response.clone()
      event.waitUntil(
        caches
          .open(CACHE_NAMES.static)
          .then((cache) => cache.put(request, copy))
          .then(() => trimCache(CACHE_NAMES.static, CACHE_LIMITS.static))
          .catch(() => {}),
      )
    }
    return response
  }

  const handleIcon = async (event) => {
    const request = event.request
    const cache = await caches.open(CACHE_NAMES.icons)
    const cached = await cache.match(request, { ignoreVary: true })
    const refresh = fetch(request).then(async (response) => {
      if (isCacheableAsset(response)) {
        await cache.put(request, response.clone())
        await trimCache(CACHE_NAMES.icons, CACHE_LIMITS.icons)
      }
      return response
    })
    if (cached) {
      event.waitUntil(refresh.catch(() => {}))
      return cached
    }
    return refresh
  }

  self.addEventListener("install", (event) => {
    event.waitUntil(
      caches
        .open(CACHE_NAMES.precache)
        .then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" })))
        .then(() => self.skipWaiting()),
    )
  })

  self.addEventListener("activate", (event) => {
    const keep = new Set(Object.values(CACHE_NAMES))
    event.waitUntil(
      caches
        .keys()
        .then((names) =>
          Promise.all(
            names
              .filter((name) => name.startsWith(CACHE_PREFIX) && !keep.has(name))
              .map((name) => caches.delete(name)),
          ),
        )
        .then(() => self.clients.claim()),
    )
  })

  self.addEventListener("fetch", (event) => {
    const request = event.request
    const kind = classifyRequest({
      method: request.method,
      url: request.url,
      origin: self.location.origin,
      mode: request.mode,
      accept: request.headers.get("accept"),
      rsc: request.headers.get("rsc"),
      prefetch:
        request.headers.get("next-router-prefetch") === "1" ||
        request.headers.get("next-router-segment-prefetch") === "1",
    })
    if (kind === "bypass") return
    if (kind === "navigate") event.respondWith(handleNavigation(event))
    else if (kind === "rsc") event.respondWith(handleRsc(event))
    else if (kind === "static") event.respondWith(handleStatic(event))
    else if (kind === "icon") event.respondWith(handleIcon(event))
  })

  self.addEventListener("message", (event) => {
    const data = event.data
    if (!data || data.type !== "cedears:page-meta" || typeof data.pathname !== "string") return
    const port = event.ports && event.ports[0]
    if (!port) return
    const clientId = event.source && event.source.id
    const value =
      (clientId && pageMeta.get(clientId + "|" + data.pathname)) ||
      pageMeta.get("*|" + data.pathname) ||
      null
    port.postMessage(value)
  })
}
