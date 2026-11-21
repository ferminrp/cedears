import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, it } from "node:test"
import vm from "node:vm"

import {
  INSTALL_DISMISS_COOLDOWN_MS,
  parseStoredInt,
  resolveInstallMethod,
  shouldShowInstallNudge,
  type InstallNudgeInput,
} from "../lib/pwa/install-eligibility.ts"
import { formatSavedAt } from "../lib/pwa/saved-at.ts"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")

describe("shouldShowInstallNudge", () => {
  const now = Date.UTC(2026, 10, 21, 15, 0)
  const base: InstallNudgeInput = {
    visits: 2,
    dismissedAt: null,
    now,
    standalone: false,
    hasDeferredPrompt: true,
    shownThisSession: false,
  }

  it("shows from the second visit when a prompt is available", () => {
    assert.equal(shouldShowInstallNudge(base), true)
    assert.equal(shouldShowInstallNudge({ ...base, visits: 7 }), true)
  })

  it("never on the first visit", () => {
    assert.equal(shouldShowInstallNudge({ ...base, visits: 1 }), false)
    assert.equal(shouldShowInstallNudge({ ...base, visits: 0 }), false)
    assert.equal(shouldShowInstallNudge({ ...base, visits: Number.NaN }), false)
  })

  it("never when installed or without a deferred prompt", () => {
    assert.equal(shouldShowInstallNudge({ ...base, standalone: true }), false)
    assert.equal(shouldShowInstallNudge({ ...base, hasDeferredPrompt: false }), false)
  })

  it("at most once per session", () => {
    assert.equal(shouldShowInstallNudge({ ...base, shownThisSession: true }), false)
  })

  it("waits 30 days after a dismissal", () => {
    const day = 24 * 60 * 60 * 1000
    assert.equal(shouldShowInstallNudge({ ...base, dismissedAt: now - day }), false)
    assert.equal(shouldShowInstallNudge({ ...base, dismissedAt: now - 29 * day }), false)
    assert.equal(
      shouldShowInstallNudge({ ...base, dismissedAt: now - INSTALL_DISMISS_COOLDOWN_MS }),
      true,
    )
    assert.equal(shouldShowInstallNudge({ ...base, dismissedAt: now - 31 * day }), true)
  })
})

describe("resolveInstallMethod", () => {
  it("prefers the Chromium prompt, falls back to iOS instructions", () => {
    assert.equal(
      resolveInstallMethod({ standalone: false, hasDeferredPrompt: true, iosAddToHomeScreen: false }),
      "prompt",
    )
    assert.equal(
      resolveInstallMethod({ standalone: false, hasDeferredPrompt: false, iosAddToHomeScreen: true }),
      "ios",
    )
    assert.equal(
      resolveInstallMethod({ standalone: false, hasDeferredPrompt: false, iosAddToHomeScreen: false }),
      null,
    )
  })

  it("hides the entry once installed", () => {
    assert.equal(
      resolveInstallMethod({ standalone: true, hasDeferredPrompt: true, iosAddToHomeScreen: true }),
      null,
    )
  })
})

describe("parseStoredInt", () => {
  it("tolerates missing and junk values", () => {
    assert.equal(parseStoredInt(null), null)
    assert.equal(parseStoredInt("abc"), null)
    assert.equal(parseStoredInt("3"), 3)
  })
})

describe("formatSavedAt", () => {
  const tz = "America/Argentina/Buenos_Aires"
  // 2026-11-21 16:58 in Buenos Aires (UTC-3).
  const now = Date.UTC(2026, 10, 21, 19, 58)

  it("says hoy for the same day", () => {
    assert.equal(formatSavedAt(now, now + 60_000, tz), "Precios guardados hoy a las 16:58")
  })

  it("says ayer for the previous calendar day", () => {
    const fetched = Date.UTC(2026, 10, 21, 2, 5) // 23:05 on the 20th in BA
    assert.equal(formatSavedAt(fetched, now, tz), "Precios guardados ayer a las 23:05")
  })

  it("uses the date for older copies", () => {
    const fetched = Date.UTC(2026, 10, 18, 12, 30) // 09:30 on the 18th in BA
    assert.equal(formatSavedAt(fetched, now, tz), "Precios guardados el 18/11 a las 09:30")
  })
})

type Classify = (req: {
  method: string
  url: string
  origin: string
  mode?: string
  accept?: string | null
  rsc?: string | null
  prefetch?: boolean
}) => string

function loadServiceWorker() {
  const source = readFileSync(join(ROOT, "public/sw.js"), "utf8")
  // No `self`/`caches` in the sandbox: the runtime block is skipped and only
  // the pure top-level functions are defined.
  const context = vm.createContext({ URL })
  vm.runInContext(source, context)
  return context as unknown as {
    classifyRequest: Classify
    pageCacheKey: (url: string) => string
    SW_VERSION: string
  }
}

describe("service worker request classification", () => {
  const sw = loadServiceWorker()
  const origin = "https://cedears.com"
  const html = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
  const nav = (path: string, extra: Partial<Parameters<Classify>[0]> = {}) =>
    sw.classifyRequest({ method: "GET", url: origin + path, origin, mode: "navigate", accept: html, ...extra })
  const sub = (path: string, extra: Partial<Parameters<Classify>[0]> = {}) =>
    sw.classifyRequest({ method: "GET", url: origin + path, origin, mode: "cors", accept: "*/*", ...extra })

  it("handles same-origin HTML navigations", () => {
    assert.equal(nav("/"), "navigate")
    assert.equal(nav("/portfolio"), "navigate")
    assert.equal(nav("/dividendos?frecuencia=mensual"), "navigate")
  })

  it("never touches markdown / JSON content negotiation", () => {
    assert.equal(nav("/", { accept: "text/markdown" }), "bypass")
    assert.equal(sub("/", { accept: "text/markdown, text/html;q=0.5" }), "bypass")
    assert.equal(sub("/", { accept: "application/json" }), "bypass")
    assert.equal(nav("/", { accept: "text/plain" }), "bypass")
    // A non-navigation fetch of `/` that is not RSC is never cached as a page.
    assert.equal(sub("/", { accept: "text/html" }), "bypass")
  })

  it("bypasses APIs, MCP, data files and crawler files", () => {
    for (const path of [
      "/mcp",
      "/mcp-docs",
      "/api/logo?ticker=AAPL",
      "/api/underlying-profile",
      "/cedears.json",
      "/cedears.csv",
      "/cedears.md",
      "/dividendos.csv",
      "/ratios.csv",
      "/llms.txt",
      "/sitemap.xml",
      "/robots.txt",
      "/.well-known/mcp.json",
      "/.well-known/api-catalog",
      "/sw.js",
    ]) {
      assert.equal(nav(path), "bypass", path)
      assert.equal(sub(path), "bypass", path)
    }
  })

  it("bypasses non-GET and cross-origin requests", () => {
    assert.equal(nav("/", { method: "POST" }), "bypass")
    assert.equal(sub("/mcp", { method: "POST", accept: "application/json" }), "bypass")
    assert.equal(
      sw.classifyRequest({
        method: "GET",
        url: "https://raw.githubusercontent.com/x/y.json",
        origin,
        mode: "cors",
        accept: "*/*",
      }),
      "bypass",
    )
    assert.equal(
      sw.classifyRequest({ method: "GET", url: "https://www.cedears.com/", origin, mode: "navigate", accept: html }),
      "bypass",
    )
  })

  it("routes vinext RSC payloads separately from HTML", () => {
    const rsc = { accept: "text/x-component", rsc: "1" }
    assert.equal(sub("/portfolio?_rsc=j7FLHZTo1wAklyJY", rsc), "rsc")
    assert.equal(sub("/portfolio.rsc", { accept: "*/*" }), "rsc")
    // Prefetches are network-only.
    assert.equal(sub("/portfolio?_rsc=abc", { ...rsc, prefetch: true }), "bypass")
    // A navigation whose URL carries _rsc is never treated as HTML or RSC.
    assert.equal(nav("/portfolio?_rsc=abc"), "bypass")
  })

  it("caches hashed assets and fonts, revalidates icons", () => {
    assert.equal(sub("/_next/static/chunks/abc123.js"), "static")
    assert.equal(sub("/_next/static/css/app.css"), "static")
    assert.equal(sub("/fonts/timeless/TimelessSans-GroteskRegular.woff2"), "static")
    assert.equal(sub("/manifest.webmanifest"), "icon")
    assert.equal(sub("/pwa/icon-192"), "icon")
    assert.equal(sub("/pwa/icon-maskable-512"), "icon")
    assert.equal(sub("/icon"), "icon")
    assert.equal(sub("/apple-icon"), "icon")
    assert.equal(sub("/og-image.webp"), "bypass")
  })

  it("keys pages without the fragment", () => {
    assert.equal(sw.pageCacheKey(origin + "/portfolio#x"), origin + "/portfolio")
    assert.equal(sw.pageCacheKey(origin + "/dividendos?frecuencia=1"), origin + "/dividendos?frecuencia=1")
  })
})
