import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  cedearsToShares,
  filterRatiosCedears,
  formatRatiosDataDate,
  formatRatiosTitleMonthYear,
  ratiosMetadataTitle,
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

  it("exports ratios csv including rows without price", () => {
    const csv = toRatiosCsv([
      sample,
      { ...sample, Cedears: "AABA", price: null },
    ])
    assert.match(csv, /^Ticker,Empresa,Ratio,Precio ARS/)
    assert.match(csv, /AAPL,Apple Inc\.,10,15000/)
    assert.match(csv, /AABA,Apple Inc\.,10,/)
    assert.equal(csv.trim().split("\n").length, 3)
  })

  it("filters by ticker, empresa and subyacente", () => {
    const filtered = filterRatiosCedears(
      [
        sample,
        { ...sample, Cedears: "GGAL", Name: "Grupo Financiero Galicia", TickerOriginal: "GGAL" },
        { ...sample, Cedears: "BABA", TickerOriginal: "BABA" },
      ],
      "galicia",
    )
    assert.equal(filtered.length, 1)
    assert.equal(filtered[0]?.Cedears, "GGAL")
  })

  it("formats data date in Argentina", () => {
    const label = formatRatiosDataDate(new Date("2026-09-16T15:03:44Z"))
    assert.equal(label, "16/09/2026")
  })

  it("builds metadata title without date suffix", () => {
    const title = ratiosMetadataTitle(new Date("2026-10-27T15:30:00Z"))
    assert.equal(title, "Ratio de CEDEARs: tabla de conversión completa")
    assert.doesNotMatch(title, /actualizado/i)
  })

  it("formats title month year in Spanish", () => {
    const label = formatRatiosTitleMonthYear(new Date("2026-10-27T15:30:00Z"))
    assert.match(label.toLowerCase(), /octubre/)
    assert.match(label, /2026/)
  })
})
