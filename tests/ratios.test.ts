import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  cedearsToShares,
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
})
