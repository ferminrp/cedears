"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { WifiOffIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { formatSavedAt } from "@/lib/pwa/saved-at"

type PageMeta = {
  pathname: string
  /** Real network fetch time of what is on screen, or null when unknown. */
  fetchedAt: number | null
  /** The service worker answered from its cache (network failed or timed out). */
  fromCache: boolean
}

const SW_META_TIMEOUT_MS = 1000
/** Re-read page meta while navigation / refresh may still be finishing in the SW. */
const META_POLL_DELAYS_MS = [0, 1000, 2500, 4500]

/**
 * Asks the service worker when the page on screen was fetched. The SW records
 * it per tab while serving the navigation / RSC request (public/sw.js).
 */
function askServiceWorker(pathname: string): Promise<Omit<PageMeta, "pathname"> | null | undefined> {
  const controller = typeof navigator !== "undefined" ? navigator.serviceWorker?.controller : null
  if (!controller) return Promise.resolve(undefined)
  return new Promise((resolve) => {
    const channel = new MessageChannel()
    const timer = window.setTimeout(() => resolve(null), SW_META_TIMEOUT_MS)
    channel.port1.onmessage = (event) => {
      window.clearTimeout(timer)
      const data = event.data as { fetchedAt?: unknown; fromCache?: unknown } | null
      if (!data) return resolve(null)
      resolve({
        fetchedAt: typeof data.fetchedAt === "number" && Number.isFinite(data.fetchedAt) ? data.fetchedAt : null,
        fromCache: data.fromCache === true,
      })
    }
    controller.postMessage({ type: "cedears:page-meta", pathname }, [channel.port2])
  })
}

/**
 * Non-blocking "Sin conexión" banner at the top of the shell. Shows while the
 * browser is offline, or when the page on screen came from the SW cache. The
 * "Precios guardados …" line only appears with a recorded fetch time.
 */
export function OfflineBanner() {
  const pathname = usePathname() ?? "/"
  const router = useRouter()
  const [online, setOnline] = useState(true)
  const [meta, setMeta] = useState<PageMeta | null>(null)
  const [retrying, setRetrying] = useState(false)
  const initialPathname = useRef(pathname)
  const latestPathname = useRef(pathname)
  latestPathname.current = pathname

  const refreshMeta = useCallback(async (path: string) => {
    const fromSw = await askServiceWorker(path)
    let next: PageMeta
    if (fromSw === undefined) {
      // No SW in control: the document came straight from the network. Only the
      // first page's time is known for sure (navigation start); client-side
      // navigations may reuse the router cache, so their time stays unknown.
      next = {
        pathname: path,
        fetchedAt: path === initialPathname.current ? Math.round(performance.timeOrigin) : null,
        fromCache: false,
      }
    } else if (fromSw === null) {
      next = { pathname: path, fetchedAt: null, fromCache: false }
    } else {
      next = { pathname: path, ...fromSw }
    }
    // Ignore late answers for a page the user already left.
    if (path === latestPathname.current) setMeta(next)
    return next
  }, [])

  const pollMeta = useCallback(
    async (path: string, options?: { stopWhenLive?: boolean }) => {
      for (const delay of META_POLL_DELAYS_MS) {
        if (path !== latestPathname.current) return
        if (delay > 0) {
          await new Promise<void>((resolve) => window.setTimeout(resolve, delay))
        }
        if (path !== latestPathname.current) return
        const next = await refreshMeta(path)
        if (options?.stopWhenLive && !next.fromCache) return
      }
    },
    [refreshMeta],
  )

  useEffect(() => {
    let cancelled = false
    void (async () => {
      await pollMeta(pathname)
      if (cancelled) return
    })()
    return () => {
      cancelled = true
    }
  }, [pathname, pollMeta])

  const retry = useCallback(() => {
    setRetrying(true)
    router.refresh()
    // router.refresh() has no completion signal; re-read what the SW served.
    window.setTimeout(async () => {
      await refreshMeta(pathname)
      setRetrying(false)
    }, 1500)
    // A slow refresh can land after the first read: read once more so a stale
    // "from cache" flag doesn't outlive fresh data (late answers for another
    // page are ignored by refreshMeta).
    window.setTimeout(() => {
      void refreshMeta(pathname)
    }, 6000)
  }, [pathname, refreshMeta, router])

  const metaRef = useRef(meta)
  metaRef.current = meta

  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    const onOnline = () => {
      update()
      // Back online while showing a saved copy: fetch fresh data in place.
      if (metaRef.current?.fromCache) retry()
    }
    update()
    window.addEventListener("online", onOnline)
    window.addEventListener("offline", update)
    return () => {
      window.removeEventListener("online", onOnline)
      window.removeEventListener("offline", update)
    }
  }, [retry])

  const current = meta?.pathname === pathname ? meta : null
  const show = !online || Boolean(current?.fromCache)
  if (!show) return null

  const savedAt = current?.fetchedAt ? formatSavedAt(current.fetchedAt, Date.now()) : null

  return (
    <div
      role="status"
      className="flex items-center gap-[var(--space-m)] rounded-[var(--radius-l)] bg-muted px-[var(--space-l)] py-[var(--space-m)] print:hidden"
    >
      <WifiOffIcon aria-hidden="true" className="size-5 shrink-0 text-muted-foreground dark:text-warning" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-[length:var(--size-m)] leading-[var(--line-m)] font-semibold">
          {online ? "Conexión inestable" : "Sin conexión"}
        </span>
        {savedAt ? (
          <span className="text-[length:var(--size-s)] leading-[var(--line-s)] text-muted-foreground">
            {savedAt}
          </span>
        ) : null}
      </div>
      <Button
        variant="outline"
        className="min-h-11 shrink-0 border-border"
        onClick={retry}
        disabled={retrying}
        aria-busy={retrying || undefined}
      >
        {retrying ? "Reintentando…" : "Reintentar"}
      </Button>
    </div>
  )
}
