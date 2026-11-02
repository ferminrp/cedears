import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { isBymaRegularSessionOpen } from "../lib/byma-hours.ts"
import { tagLabelToThemeLower } from "../lib/category-content.ts"

describe("BYMA session hours", () => {
  it("is closed on Saturday ART", () => {
    const sat = new Date("2026-11-07T15:00:00-03:00")
    assert.equal(isBymaRegularSessionOpen(sat), false)
  })

  it("is open weekday midday ART", () => {
    const mid = new Date("2026-11-03T14:00:00-03:00")
    assert.equal(isBymaRegularSessionOpen(mid), true)
  })

  it("is closed before 11:00 ART", () => {
    const early = new Date("2026-11-03T10:30:00-03:00")
    assert.equal(isBymaRegularSessionOpen(early), false)
  })
})

describe("tag display labels", () => {
  it("lowercases tag labels and normalizes ampersand", () => {
    assert.equal(
      tagLabelToThemeLower("Minería & Metales"),
      "minería y metales",
    )
    assert.equal(tagLabelToThemeLower("Petróleo y Gas"), "petróleo y gas")
    assert.equal(
      tagLabelToThemeLower("Automotrices y EV"),
      "automotrices y EV",
    )
  })
})

describe("resolveCedearPctChange", () => {
  it("uses previous close when pct_change is missing", async () => {
    const { resolveCedearPctChange } = await import("../lib/cedears.ts")
    const cedear = {
      Cedears: "X",
      Name: "X",
      Market: "NYSE",
      Ratio: "1",
      TickerOriginal: "X",
      yahooSymbol: null,
      tags: [],
      price: 110,
      pctChange: null,
      previousClose: 100,
      volume: null,
      usPrice: null,
      priceMep: null,
      priceCcl: null,
    }
    assert.equal(resolveCedearPctChange(cedear), 10)
  })

  it("returns null without previous close", async () => {
    const { resolveCedearPctChange } = await import("../lib/cedears.ts")
    const cedear = {
      Cedears: "X",
      Name: "X",
      Market: "NYSE",
      Ratio: "1",
      TickerOriginal: "X",
      yahooSymbol: null,
      tags: [],
      price: 110,
      pctChange: null,
      previousClose: null,
      volume: null,
      usPrice: null,
      priceMep: null,
      priceCcl: null,
    }
    assert.equal(resolveCedearPctChange(cedear), null)
  })
})
