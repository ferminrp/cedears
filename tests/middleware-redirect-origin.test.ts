import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  isProductionCedearsHost,
  middlewareRedirectOrigin,
  trustedApexOrigin,
} from "../lib/www-redirect.ts"

describe("middlewareRedirectOrigin", () => {
  const prev = process.env.NEXT_PUBLIC_SITE_URL

  it("uses the request host on preview / workers.dev", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://cedears.com"
    try {
      const url = new URL("https://pr-foo.cedears.workers.dev/mcp-docs")
      const headers = new Headers({
        Host: "pr-foo.cedears.workers.dev",
        "x-forwarded-proto": "https",
      })
      assert.equal(
        middlewareRedirectOrigin(headers, url),
        "https://pr-foo.cedears.workers.dev",
      )
    } finally {
      process.env.NEXT_PUBLIC_SITE_URL = prev
    }
  })

  it("uses trusted apex on production cedears.com hosts", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://cedears.com"
    try {
      const url = new URL("https://cedears.com/cedear/aapl")
      const headers = new Headers({ Host: "cedears.com" })
      assert.equal(
        middlewareRedirectOrigin(headers, url),
        trustedApexOrigin(),
      )
    } finally {
      process.env.NEXT_PUBLIC_SITE_URL = prev
    }
  })

  it("classifies production hostnames", () => {
    assert.equal(isProductionCedearsHost("cedears.com"), true)
    assert.equal(isProductionCedearsHost("www.cedears.com"), true)
    assert.equal(isProductionCedearsHost("preview.cedears.workers.dev"), false)
    assert.equal(isProductionCedearsHost("127.0.0.1:3011"), false)
  })
})