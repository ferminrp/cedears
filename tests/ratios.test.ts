import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { latestYfinanceFetchedAtFromRecords } from "../lib/cedear-source"
import {
  cedearsToShares,
  cedearsWithArsPrice,
  formatRatiosDataDate,
  ratiosPageTitle,
  sharesToCedears,
  theoreticalArsAtCcl,
  toRatiosCsv,
} from "../lib/ratios"
import type { Cedear } from "../lib/cedears"

const sample: Cedear = {
  Cedears: "AAPL",
  Name: "Apple Inc.",
  Market: "NASDAQ",
  Ratio: "10",
  TickerOriginal: "AAPL",
  tags: [],
  price: 15000,
  pctChange: 1,
  volume: 1000,
  usPrice: 200,
  priceMep: 18,
  priceCcl: 17,
}

describe("ratios helpers", () => {
  it("converts cedears to shares and back", () => {
    assert.equal(cedearsToShares(10, 10), 1)
    assert.equal(sharesToCedears(1, 10), 10)
  })

  it("computes theoretical ARS at CCL", () => {
    const ars = theoreticalArsAtCcl(sample, 1500)
    assert.equal(ars, 30000)
  })

  it("exports ratios csv", () => {
    const csv = toRatiosCsv([sample])
    assert.match(csv, /^Ticker,Empresa,Ratio,Precio ARS/)
    assert.match(csv, /AAPL,Apple Inc\.,10,15000/)
  })

  it("omits tickers without ARS price from csv", () => {
    const csv = toRatiosCsv([
      sample,
      { ...sample, Cedears: "AABA", price: null },
    ])
    assert.doesNotMatch(csv, /AABA/)
    assert.equal(csv.trim().split("\n").length, 2)
  })

  it("filters cedears with ARS price", () => {
    const filtered = cedearsWithArsPrice([
      sample,
      { ...sample, Cedears: "AABA", price: null },
    ])
    assert.equal(filtered.length, 1)
    assert.equal(filtered[0]?.Cedears, "AAPL")
  })

  it("formats data date in Argentina", () => {
    const label = formatRatiosDataDate(new Date("2026-09-16T15:03:44Z"))
    assert.equal(label, "16/09/2026")
  })

  it("builds page title from yfinance fetched_at", () => {
    const title = ratiosPageTitle(new Date("2026-09-16T15:03:44Z"))
    assert.equal(
      title,
      "Ratios de conversión de CEDEARs (actualizado 16/09/2026)",
    )
  })

  it("reads latest yfinance fetched_at from records", () => {
    const at = latestYfinanceFetchedAtFromRecords([
      {
        Cedears: "A",
        "yfinance-metadata": { fetched_at: "2026-07-21T10:55:44Z" },
      },
      {
        Cedears: "B",
        "yfinance-metadata": { fetched_at: "2026-09-16T15:03:44Z" },
      },
    ])
    assert.equal(at?.toISOString(), "2026-09-16T15:03:44.000Z")
  })
})
