import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { rankPickerResults } from "../lib/picker-search.ts"
import {
  computeAccumulation,
  parsePortfolioCsv,
  partitionPortfolioEntries,
  portfolioToCsv,
  requiredAccumulationContribution,
  type RebalanceInput,
  type SelectedCedear,
} from "../lib/tools.ts"

function holding(
  ticker: string,
  price: number | null,
  quantity: number,
  targetPct: number,
): RebalanceInput {
  const cedear: SelectedCedear = {
    Cedears: ticker,
    Name: ticker,
    TickerOriginal: ticker,
    price,
  }
  return { cedear, quantity, targetPct }
}

describe("computeAccumulation", () => {
  it("never sells and only buys underweight names", () => {
    const result = computeAccumulation(
      [
        holding("A", 100, 10, 50),
        holding("B", 100, 2, 50),
      ],
      800,
    )

    const a = result.rows.find((r) => r.ticker === "A")
    const b = result.rows.find((r) => r.ticker === "B")
    assert.ok(a && b)
    assert.equal(a.deltaNominales, 0)
    assert.equal(b.deltaNominales, 8)
    assert.ok(result.rows.every((row) => row.deltaNominales >= 0))
    assert.equal(result.invested, 800)
    assert.equal(result.residualCash, 0)
  })

  it("floors to whole shares and spends leftover on the largest gap", () => {
    const result = computeAccumulation(
      [
        holding("A", 30, 1, 50),
        holding("B", 30, 10, 50),
      ],
      100,
    )

    assert.ok(result.rows.every((row) => Number.isInteger(row.deltaNominales)))
    assert.ok(result.rows.every((row) => row.deltaNominales >= 0))
    const bought = result.rows.reduce((acc, row) => acc + row.deltaNominales, 0)
    assert.equal(bought, 3)
    assert.equal(result.invested, 90)
    assert.equal(result.residualCash, 10)
    const a = result.rows.find((r) => r.ticker === "A")
    assert.equal(a?.deltaNominales, 3)
  })

  it("does not buy names with 0% target", () => {
    const result = computeAccumulation(
      [holding("A", 50, 4, 0), holding("B", 50, 0, 100)],
      200,
    )
    const a = result.rows.find((r) => r.ticker === "A")
    const b = result.rows.find((r) => r.ticker === "B")
    assert.equal(a?.deltaNominales, 0)
    assert.equal(b?.deltaNominales, 4)
  })

  it("computes the minimum contribution to hit targets without selling", () => {
    const inputs = [holding("A", 100, 8, 50), holding("B", 100, 2, 50)]
    assert.equal(requiredAccumulationContribution(inputs), 600)
    const result = computeAccumulation(inputs, 600)
    assert.equal(result.requiredContribution, 600)
    const a = result.rows.find((r) => r.ticker === "A")
    const b = result.rows.find((r) => r.ticker === "B")
    assert.equal(a?.newQuantity, 8)
    assert.equal(b?.newQuantity, 8)
  })

  it("returns null required contribution when a holding has 0% target", () => {
    const inputs = [holding("A", 100, 5, 0), holding("B", 100, 5, 100)]
    assert.equal(requiredAccumulationContribution(inputs), null)
    assert.equal(computeAccumulation(inputs, 100).requiredContribution, null)
  })

  it("treats an empty portfolio as already able to buy the mix (required 0)", () => {
    const inputs = [holding("A", 100, 0, 60), holding("B", 100, 0, 40)]
    assert.equal(requiredAccumulationContribution(inputs), 0)
  })

  it("buys nothing with a zero contribution", () => {
    const result = computeAccumulation(
      [holding("A", 10, 1, 50), holding("B", 10, 9, 50)],
      0,
    )
    assert.ok(result.rows.every((row) => row.deltaNominales === 0))
    assert.equal(result.invested, 0)
  })

  it("marks missing prices and skips buying those names", () => {
    const result = computeAccumulation(
      [holding("A", null, 2, 50), holding("B", 20, 0, 50)],
      100,
    )
    assert.equal(result.hasMissingPrices, true)
    const a = result.rows.find((r) => r.ticker === "A")
    const b = result.rows.find((r) => r.ticker === "B")
    assert.equal(a?.deltaNominales, 0)
    assert.equal(b?.deltaNominales, 5)
  })

  it("uses post-buy values for newPct (composition after buying)", () => {
    const result = computeAccumulation(
      [holding("A", 100, 10, 50), holding("B", 100, 2, 50)],
      800,
    )
    const pctSum = result.rows.reduce((acc, row) => acc + row.newPct, 0)
    assert.ok(Math.abs(pctSum - 100) < 1e-6)
    const a = result.rows.find((r) => r.ticker === "A")
    const b = result.rows.find((r) => r.ticker === "B")
    assert.ok(a && b)
    assert.equal(a.newValue, 1000)
    assert.equal(b.newValue, 1000)
    assert.equal(a.newPct, 50)
    assert.equal(b.newPct, 50)
  })
})

describe("portfolio CSV", () => {
  it("serializes ticker,nominales,objetivo_pct with a trailing newline", () => {
    const csv = portfolioToCsv([
      { ticker: "AAPL", quantity: 10, targetPct: 40 },
      { ticker: "KO", quantity: 5, targetPct: 60 },
    ])
    assert.equal(
      csv,
      "ticker,nominales,objetivo_pct\nAAPL,10,40\nKO,5,60\n",
    )
  })

  it("round-trips the exported format", () => {
    const entries = [
      { ticker: "MELI", quantity: 3, targetPct: 25.5 },
      { ticker: "GGAL", quantity: 100, targetPct: 74.5 },
    ]
    assert.deepEqual(parsePortfolioCsv(portfolioToCsv(entries)), entries)
  })

  it("parses Excel ES semicolon + decimal comma and strips a BOM", () => {
    const text = "\uFEFFticker;nominales;objetivo_pct\r\nAAPL;10;25,5\r\nKO;1.000;74,5\n"
    assert.deepEqual(parsePortfolioCsv(text), [
      { ticker: "AAPL", quantity: 10, targetPct: 25.5 },
      { ticker: "KO", quantity: 1000, targetPct: 74.5 },
    ])
  })

  it("skips the header, blank lines, and invalid numbers", () => {
    const text = [
      "ticker,nominales,objetivo_pct",
      "",
      "  aapl , 4 , 50% ",
      "NOPE,abc,-3",
      "",
    ].join("\n")
    assert.deepEqual(parsePortfolioCsv(text), [
      { ticker: "AAPL", quantity: 4, targetPct: 50 },
      { ticker: "NOPE", quantity: 0, targetPct: 0 },
    ])
  })

  it("keeps the last row when a ticker is duplicated", () => {
    const text = "AAPL,1,10\nAAPL,2,20\n"
    assert.deepEqual(parsePortfolioCsv(text), [
      { ticker: "AAPL", quantity: 2, targetPct: 20 },
    ])
  })

  it("parses quoted tickers that contain a comma", () => {
    const csv = portfolioToCsv([
      { ticker: "FOO,BAR", quantity: 1, targetPct: 100 },
    ])
    assert.match(csv, /"FOO,BAR"/)
    assert.deepEqual(parsePortfolioCsv(csv), [
      { ticker: "FOO,BAR", quantity: 1, targetPct: 100 },
    ])
  })

  it("returns an empty list for empty or header-only input", () => {
    assert.deepEqual(parsePortfolioCsv(""), [])
    assert.deepEqual(parsePortfolioCsv("ticker,nominales,objetivo_pct\n"), [])
  })

  it("partitions unknown tickers without dropping known rows", () => {
    const parsed = parsePortfolioCsv("AAPL,1,50\nZZZZ,2,50\nKO,3,0\n")
    const { known, unknownTickers } = partitionPortfolioEntries(
      parsed,
      new Set(["AAPL", "KO"]),
    )
    assert.deepEqual(known, [
      { ticker: "AAPL", quantity: 1, targetPct: 50 },
      { ticker: "KO", quantity: 3, targetPct: 0 },
    ])
    assert.deepEqual(unknownTickers, ["ZZZZ"])
  })
})

describe("rankPickerResults", () => {
  const assets = [
    { ticker: "AAL", name: "American Airlines" },
    { ticker: "AAPL", name: "Apple Inc" },
    { ticker: "APD", name: "Air Products" },
    { ticker: "KO", name: "The Coca-Cola Company" },
  ]

  it("ranks exact ticker before prefix before substring", () => {
    const ranked = rankPickerResults(assets, "aap", new Set()).map((a) => a.ticker)
    assert.deepEqual(ranked, ["AAPL"])
    const appleFirst = rankPickerResults(assets, "aa", new Set()).map((a) => a.ticker)
    assert.equal(appleFirst[0], "AAL")
    assert.ok(appleFirst.includes("AAPL"))
  })

  it("omits already selected tickers and matches names", () => {
    const ranked = rankPickerResults(assets, "coca", new Set(["KO"]))
    assert.deepEqual(ranked, [])
    const byName = rankPickerResults(assets, "apple", new Set())
    assert.deepEqual(
      byName.map((a) => a.ticker),
      ["AAPL"],
    )
  })
})
