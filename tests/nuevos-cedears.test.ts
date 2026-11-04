import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  BULK_INFERENCE_DAY_THRESHOLD,
  NUEVOS_CEDEARS_METADATA_TITLE,
  NUEVOS_CEDEARS_PAGE_H1,
  buildQualifiedNuevosRows,
  buildNuevosCedearsPageModel,
  buildTickerCountsByDay,
  excludeBulkInferenceDays,
  formatDetectedSince,
  formatNuevosRatio,
  getNuevosCedearsRows,
  isBulkInferenceDay,
  isNuevoCedearBadge,
  splitNuevosVisibleRows,
} from "../lib/nuevos-cedears.ts"

describe("nuevos-cedears", () => {
  it("metadata targets nuevos cedears search phrasing", () => {
    assert.match(NUEVOS_CEDEARS_PAGE_H1, /nuevos cedears/i)
    assert.match(NUEVOS_CEDEARS_METADATA_TITLE, /nuevos cedears/i)
    assert.match(NUEVOS_CEDEARS_METADATA_TITLE, /CEDEARs Argentina/)
  })

  it("rows are sorted by detectedSince descending", () => {
    const rows = getNuevosCedearsRows()
    assert.ok(rows.length > 0)
    for (let i = 1; i < rows.length; i++) {
      assert.ok(
        rows[i - 1].detectedSince >= rows[i].detectedSince,
        `order at ${i}: ${rows[i - 1].ticker} vs ${rows[i].ticker}`,
      )
    }
  })

  it("flags bulk inference days above threshold", () => {
    const counts = buildTickerCountsByDay(getNuevosCedearsRows())
    assert.equal(isBulkInferenceDay("2026-01-22", counts), true)
    assert.equal(isBulkInferenceDay("2026-09-16", counts), false)
    assert.ok(
      (counts.get("2026-01-22") ?? 0) > BULK_INFERENCE_DAY_THRESHOLD,
    )
  })

  it("excludes bulk inference days from qualified rows", () => {
    const ref = new Date("2026-11-04T12:00:00.000Z")
    const qualified = buildQualifiedNuevosRows(ref)
    assert.ok(
      qualified.every((row) => row.detectedSince !== "2026-01-22"),
    )
    assert.ok(
      qualified.every((row) => row.detectedSince !== "2026-06-03"),
    )
  })

  it("limits default visible rows to 30", () => {
    const ref = new Date("2026-11-04T12:00:00.000Z")
    const qualified = buildQualifiedNuevosRows(ref)
    const { visible, hidden } = splitNuevosVisibleRows(qualified)
    assert.ok(visible.length <= 30)
    assert.equal(visible.length + hidden.length, qualified.length)
  })

  it("marks tickers from the last 7 days as nuevo", () => {
    const ref = new Date("2026-11-04T12:00:00.000Z")
    assert.equal(isNuevoCedearBadge("2026-11-03", ref), true)
    assert.equal(isNuevoCedearBadge("2026-10-01", ref), false)
  })

  it("formatDetectedSince renders es-AR day", () => {
    assert.match(formatDetectedSince("2026-09-16"), /\d{2}\/\d{2}\/\d{4}/)
  })

  it("formatNuevosRatio handles missing values", () => {
    assert.deepEqual(formatNuevosRatio(""), {
      display: "—",
      ariaLabel: "Ratio sin informar",
    })
    assert.equal(formatNuevosRatio("10").display, "10:1")
  })

  it("buildNuevosCedearsPageModel does not enable search", () => {
    const model = buildNuevosCedearsPageModel(
      new Date("2026-11-04T12:00:00.000Z"),
    )
    assert.ok(model.count6Months < 60)
    assert.ok(model.count6Months > 0)
    assert.equal("needsSearch" in model, false)
  })
})
