import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  countDividendsInLast12Months,
  inferFrequencyFromPaymentCount,
  pickUpcomingIsoDate,
  yahooDateToIsoDate,
} from "../lib/dividend-display.ts"

describe("dividend display helpers", () => {
  it("converts Yahoo dates to Eastern ISO dates", () => {
    assert.equal(
      yahooDateToIsoDate(new Date("2026-08-10T13:30:00.000Z")),
      "2026-08-10",
    )
  })

  it("picks the earliest upcoming ex-dividend date", () => {
    assert.equal(
      pickUpcomingIsoDate(
        ["2026-12-01", "2026-05-01", null, "2026-11-15"],
        "2026-10-28",
      ),
      "2026-11-15",
    )
    assert.equal(
      pickUpcomingIsoDate(["2026-05-01", "2026-08-01"], "2026-10-28"),
      null,
    )
  })

  it("infers dividend frequency from payment count", () => {
    assert.equal(inferFrequencyFromPaymentCount(11), "Mensual")
    assert.equal(inferFrequencyFromPaymentCount(4), "Trimestral")
    assert.equal(inferFrequencyFromPaymentCount(2), "Semestral")
    assert.equal(inferFrequencyFromPaymentCount(1), "Anual")
    assert.equal(inferFrequencyFromPaymentCount(0), null)
  })

  it("counts dividend events in the last 12 months", () => {
    const count = countDividendsInLast12Months(
      ["2025-11-01", "2026-03-01", "2026-06-01", "2027-01-01"],
      "2026-10-28",
    )
    assert.equal(count, 3)
  })
})
