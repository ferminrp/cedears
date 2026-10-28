import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  CATEGORY_SLUG_REDIRECTS,
  canonicalCategorySlug,
} from "../lib/category-redirects.ts"
import { buildCedearTickerSet } from "../lib/cedear-ticker-set.ts"
import {
  cedearLastModified,
  maxLastModified,
  staticRouteLastModified,
} from "../lib/sitemap-lastmod.ts"

describe("cedear ticker set", () => {
  it("normalizes tickers to uppercase", () => {
    const set = buildCedearTickerSet([
      {
        Cedears: "aapl",
        Name: "Apple",
        Market: "NASDAQ",
        Ratio: "10",
        TickerOriginal: "AAPL",
        tags: [],
      },
    ])
    assert.equal(set.has("AAPL"), true)
    assert.equal(set.has("ZZZZ"), false)
  })
})

describe("category redirects", () => {
  it("maps legacy slugs to canonical Spanish URLs", () => {
    assert.equal(CATEGORY_SLUG_REDIRECTS.tech, "tecnologia")
    assert.equal(CATEGORY_SLUG_REDIRECTS.cripto, "cripto-y-bitcoin")
    assert.equal(CATEGORY_SLUG_REDIRECTS["farma-y-biotecnologia"], "salud")
  })

  it("leaves canonical slugs unchanged", () => {
    assert.equal(canonicalCategorySlug("tecnologia"), "tecnologia")
    assert.equal(canonicalCategorySlug("salud"), "salud")
  })
})

describe("sitemap lastmod", () => {
  it("uses yfinance fetched_at for cedear rows", () => {
    const d = cedearLastModified({
      Cedears: "AAPL",
      Name: "Apple",
      Market: "NASDAQ",
      Ratio: "10",
      TickerOriginal: "AAPL",
      tags: [],
      yfinanceFetchedAt: "2026-07-21T10:55:44Z",
    })
    assert.equal(d.toISOString(), "2026-07-21T10:55:44.000Z")
  })

  it("picks the latest date in a set", () => {
    const max = maxLastModified([
      new Date("2026-01-01T00:00:00.000Z"),
      new Date("2026-03-01T00:00:00.000Z"),
    ])
    assert.equal(max.toISOString(), "2026-03-01T00:00:00.000Z")
  })

  it("exposes stable static route timestamps", () => {
    assert.equal(
      staticRouteLastModified("/herramientas/dca").toISOString(),
      "2026-10-07T12:27:58.000Z",
    )
  })
})
