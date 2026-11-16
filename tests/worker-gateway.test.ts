import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { buildWwwToApexRedirect } from "../lib/www-redirect.ts"
import { workersCacheKeyWithProps } from "../lib/workers-cache-key.ts"

describe("worker gateway redirect (fetch simulation)", () => {
  const APEX = "https://cedears.com"

  it("apex warms cache; www still 301; apex stays 200", async () => {
    const cache = new Map<string, number>()

    const apexReq = new Request("https://cedears.com/", {
      headers: { Host: "cedears.com" },
    })
    const wwwReq = new Request("https://www.cedears.com/", {
      headers: { Host: "www.cedears.com" },
    })

    const apexKey = workersCacheKeyWithProps(apexReq, "CachedVinext", {
      cachePartition: "apex",
    })
    cache.set(apexKey, 200)

    assert.equal(cache.get(apexKey), 200)

    const wwwRes = buildWwwToApexRedirect(wwwReq, { siteUrl: APEX })
    assert.equal(wwwRes?.status, 301)
    assert.equal(wwwRes?.headers.get("Location"), `${APEX}/`)

    assert.equal(cache.get(apexKey), 200)
  })
})
