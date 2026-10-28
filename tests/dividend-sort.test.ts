import assert from "node:assert/strict"
import { describe, it } from "node:test"
import type { CedearDividendRow } from "../lib/dividends.ts"
import { sortDividendRows } from "../lib/dividend-sort.ts"

function row(
  partial: Pick<CedearDividendRow, "cedear"> &
    Partial<CedearDividendRow>,
): CedearDividendRow {
  return {
    cedear: partial.cedear,
    name: partial.name ?? partial.cedear,
    market: "NYSE",
    tickerOriginal: partial.tickerOriginal ?? partial.cedear,
    ratio: "10",
    dividendYield: partial.dividendYield ?? 0.03,
    dividendRateUsd: partial.dividendRateUsd ?? 1,
    estimatedCedearUsd: partial.estimatedCedearUsd ?? 0.1,
    frequency: partial.frequency ?? "Trimestral",
    exDividendDate: partial.exDividendDate ?? null,
    dividendPaymentDate: partial.dividendPaymentDate ?? null,
  }
}

describe("sortDividendRows", () => {
  it("keeps rows without ex-date last when sorting desc", () => {
    const rows = [
      row({ cedear: "AAA", exDividendDate: null }),
      row({ cedear: "BBB", exDividendDate: "2026-12-01" }),
      row({ cedear: "CCC", exDividendDate: "2026-11-01" }),
    ]
    const sorted = sortDividendRows(rows, "exDate", "desc")
    assert.deepEqual(
      sorted.map((r) => r.cedear),
      ["BBB", "CCC", "AAA"],
    )
  })

  it("keeps rows without yield last when sorting desc", () => {
    const rows: CedearDividendRow[] = [
      { ...row({ cedear: "BBB", dividendYield: 0.05 }) },
      { ...row({ cedear: "CCC", dividendYield: 0.02 }) },
      { ...row({ cedear: "AAA" }), dividendYield: null },
    ]
    const sorted = sortDividendRows(rows, "yield", "desc")
    assert.deepEqual(
      sorted.map((r) => r.cedear),
      ["BBB", "CCC", "AAA"],
    )
  })
})
