import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { absoluteCanonical } from "../lib/canonical.ts"
import {
  extractCanonicalHref,
  isCanonicalInHead,
} from "../lib/canonical-html.ts"

describe("absoluteCanonical", () => {
  it("builds absolute URLs from paths", () => {
    const prev = process.env.NEXT_PUBLIC_SITE_URL
    process.env.NEXT_PUBLIC_SITE_URL = "https://cedears.com"
    assert.equal(absoluteCanonical("/cedear/AAPL"), "https://cedears.com/cedear/AAPL")
    assert.equal(absoluteCanonical("/"), "https://cedears.com/")
    process.env.NEXT_PUBLIC_SITE_URL = prev
  })
})

describe("canonical HTML helpers", () => {
  it("detects canonical link inside head", () => {
    const html =
      '<html><head><link rel="canonical" href="https://cedears.com/cedear/AAPL"></head><body></body></html>'
    assert.equal(isCanonicalInHead(html), true)
    assert.equal(
      extractCanonicalHref(html),
      "https://cedears.com/cedear/AAPL",
    )
  })

  it("rejects canonical injected after head", () => {
    const html =
      "<html><head></head><body><link rel=\"canonical\" href=\"https://cedears.com/\"></body></html>"
    assert.equal(isCanonicalInHead(html), false)
  })
})
