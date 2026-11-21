import assert from "node:assert/strict"
import { describe, it } from "node:test"
import type { Cedear } from "../lib/cedears.ts"
import {
  computePortfolioHoldingRows,
  parseQuantityInput,
  resolvePortfolioTicker,
  setHoldingQuantity,
  stepQuantity,
} from "../lib/portfolio.ts"

function cedear(ticker: string, price: number | null): Cedear {
  return {
    Cedears: ticker,
    Name: `${ticker} Inc.`,
    Market: "",
    Ratio: "1:1",
    TickerOriginal: ticker,
    yahooSymbol: null,
    tags: [],
    price,
    pctChange: null,
    volume: null,
    usPrice: null,
    priceMep: null,
    priceCcl: null,
  }
}

describe("resolvePortfolioTicker", () => {
  const tickers = new Set(["SPY", "NVDA", "BRK.B"])

  it("matches case-insensitively and returns the canonical ticker", () => {
    assert.equal(resolvePortfolioTicker("spy", tickers), "SPY")
    assert.equal(resolvePortfolioTicker(" Nvda ", tickers), "NVDA")
    assert.equal(resolvePortfolioTicker("brk.b", tickers), "BRK.B")
  })

  it("rejects unknown, empty or missing values", () => {
    assert.equal(resolvePortfolioTicker("XXXX", tickers), null)
    assert.equal(resolvePortfolioTicker("", tickers), null)
    assert.equal(resolvePortfolioTicker(null, tickers), null)
    assert.equal(resolvePortfolioTicker(undefined, tickers), null)
  })
})

describe("parseQuantityInput", () => {
  it("parses integers, es-AR thousands and decimals", () => {
    assert.equal(parseQuantityInput("10"), 10)
    assert.equal(parseQuantityInput(" 10 "), 10)
    assert.equal(parseQuantityInput("1.000"), 1000)
    assert.equal(parseQuantityInput("1.000,5"), 1000.5)
    assert.equal(parseQuantityInput("2,5"), 2.5)
    assert.equal(parseQuantityInput("2.5"), 2.5)
  })

  it("treats empty as zero and rejects garbage", () => {
    assert.equal(parseQuantityInput(""), 0)
    assert.equal(parseQuantityInput("-3"), null)
    assert.equal(parseQuantityInput("abc"), null)
    assert.equal(parseQuantityInput("1,2,3"), null)
  })
})

describe("stepQuantity", () => {
  it("adds and subtracts without going below zero", () => {
    assert.equal(stepQuantity(0, 1), 1)
    assert.equal(stepQuantity(9, 1), 10)
    assert.equal(stepQuantity(1, -1), 0)
    assert.equal(stepQuantity(0, -1), 0)
    assert.equal(stepQuantity(Number.NaN, 1), 1)
    assert.equal(stepQuantity(0.2, 0.1), 0.3)
  })
})

describe("computePortfolioHoldingRows", () => {
  const cedears = [
    cedear("SPY", 20720),
    cedear("NVDA", 9460),
    cedear("MELI", 20280),
    cedear("AAPL", null),
    cedear("KO", 100),
  ]

  it("lists only holdings, largest value first, with % of the portfolio", () => {
    const rows = computePortfolioHoldingRows(cedears, {
      SPY: 5,
      NVDA: 10,
      MELI: 3,
      AAPL: 2,
      GONE: 4,
    })
    assert.deepEqual(
      rows.map((r) => r.ticker),
      ["SPY", "NVDA", "MELI", "AAPL"],
    )
    assert.equal(rows[0].valueArs, 103600)
    assert.equal(rows[1].valueArs, 94600)
    const total = 103600 + 94600 + 60840
    assert.ok(Math.abs((rows[0].pct ?? 0) - (103600 / total) * 100) < 1e-9)
    assert.equal(rows[3].valueArs, null)
    assert.equal(rows[3].pct, null)
  })

  it("is empty when there are no holdings", () => {
    assert.deepEqual(computePortfolioHoldingRows(cedears, {}), [])
  })

  it("works on holdings saved by the old table UI", () => {
    // The old UI stored a plain { TICKER: nominales } map; removing set 0 → deleted.
    let holdings = setHoldingQuantity({}, "KO", 7)
    holdings = setHoldingQuantity(holdings, "SPY", 0)
    assert.deepEqual(holdings, { KO: 7 })
    const rows = computePortfolioHoldingRows(cedears, holdings)
    assert.equal(rows.length, 1)
    assert.equal(rows[0].valueArs, 700)
    assert.equal(rows[0].pct, 100)
  })
})
