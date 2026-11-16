import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { buildWwwToApexRedirect } from "../lib/www-redirect.ts"
import {
  workersCacheKeyWithProps,
  workersCacheUrlKey,
} from "../lib/workers-cache-key.ts"

const APEX = "https://cedears.com"

function req(
  url: string,
  host: string,
  init: { method?: string } = {},
): Request {
  const headers = new Headers({ Host: host })
  return new Request(url, { ...init, headers })
}

describe("buildWwwToApexRedirect", () => {
  const prev = process.env.NEXT_PUBLIC_SITE_URL
  it("www / → 301 apex", () => {
    process.env.NEXT_PUBLIC_SITE_URL = APEX
    try {
      const r = buildWwwToApexRedirect(
        req("https://www.cedears.com/", "www.cedears.com"),
      )
      assert.ok(r)
      assert.equal(r.status, 301)
      assert.equal(r.headers.get("Location"), `${APEX}/`)
      assert.match(r.headers.get("Cache-Control") ?? "", /no-store/)
    } finally {
      process.env.NEXT_PUBLIC_SITE_URL = prev
    }
  })

  it("preserves path and query", () => {
    process.env.NEXT_PUBLIC_SITE_URL = APEX
    try {
      const r = buildWwwToApexRedirect(
        req(
          "https://www.cedears.com/cedear/AAPL?foo=1",
          "www.cedears.com",
        ),
      )
      assert.ok(r)
      assert.equal(
        r.headers.get("Location"),
        `${APEX}/cedear/AAPL?foo=1`,
      )
    } finally {
      process.env.NEXT_PUBLIC_SITE_URL = prev
    }
  })

  it("treats Host with port as www", () => {
    process.env.NEXT_PUBLIC_SITE_URL = APEX
    try {
      const r = buildWwwToApexRedirect(
        req("http://127.0.0.1:8787/", "www.cedears.com:8787"),
        { siteUrl: APEX },
      )
      assert.equal(r?.status, 301)
      assert.equal(r?.headers.get("Location"), `${APEX}/`)
    } finally {
      process.env.NEXT_PUBLIC_SITE_URL = prev
    }
  })

  it("apex / → no redirect", () => {
    process.env.NEXT_PUBLIC_SITE_URL = APEX
    try {
      assert.equal(
        buildWwwToApexRedirect(
          req("https://cedears.com/", "cedears.com"),
        ),
        null,
      )
    } finally {
      process.env.NEXT_PUBLIC_SITE_URL = prev
    }
  })
})

describe("Workers Cache host partitioning", () => {
  const prev = process.env.NEXT_PUBLIC_SITE_URL

  it("default URL key ignores hostname (reproduces the bug)", () => {
    const apex = req("https://cedears.com/ratios", "cedears.com")
    const www = req("https://www.cedears.com/ratios", "www.cedears.com")
    assert.equal(workersCacheUrlKey(apex), workersCacheUrlKey(www))
  })

  it("apex props partition www redirect pollution from apex HTML", () => {
    process.env.NEXT_PUBLIC_SITE_URL = APEX
    const path = "/"
    const apexReq = req(`https://cedears.com${path}`, "cedears.com")
    const wwwReq = req(`https://www.cedears.com${path}`, "www.cedears.com")

    const legacyKey = workersCacheUrlKey(apexReq)
    const store = new Map<string, { status: number; body: string }>()
    store.set(legacyKey, { status: 301, body: "" })

    const apexHit = store.get(workersCacheUrlKey(apexReq))
    assert.equal(apexHit?.status, 301, "legacy shared key serves stale www redirect on apex")

    const apexPropsKey = workersCacheKeyWithProps(apexReq, "CachedVinext", {
      cachePartition: "apex",
    })
    store.set(apexPropsKey, { status: 200, body: "<html>ok</html>" })

    assert.equal(store.get(apexPropsKey)?.status, 200)
    assert.equal(
      buildWwwToApexRedirect(wwwReq)?.status,
      301,
      "www still redirects with gateway (no cache read)",
    )
    assert.equal(
      store.get(apexPropsKey)?.status,
      200,
      "apex props entry stays 200 after www request",
    )
    process.env.NEXT_PUBLIC_SITE_URL = prev
  })

  it("after warming apex cache, www still redirects", () => {
    process.env.NEXT_PUBLIC_SITE_URL = APEX
    const www = req("https://www.cedears.com/", "www.cedears.com")
    const apex = req("https://cedears.com/", "cedears.com")
    const warmKey = workersCacheKeyWithProps(apex, "CachedVinext", {
      cachePartition: "apex",
    })
    const cache = new Map<string, number>([[warmKey, 200]])

    assert.equal(cache.get(warmKey), 200)
    assert.equal(buildWwwToApexRedirect(www)?.status, 301)
    process.env.NEXT_PUBLIC_SITE_URL = prev
  })
})
