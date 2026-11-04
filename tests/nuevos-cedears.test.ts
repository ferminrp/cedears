import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  NUEVOS_CEDEARS_METADATA_TITLE,
  NUEVOS_CEDEARS_PAGE_H1,
  buildNuevosCedearsPageModel,
  filterNuevosLast12Months,
  formatDetectedSince,
  formatNuevosRatio,
  getNuevosCedearsRows,
  groupNuevosCedearsByMonth,
  isNuevoCedearBadge,
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

  it("filters to the last 12 months", () => {
    const ref = new Date("2026-11-04T12:00:00.000Z")
    const rows = filterNuevosLast12Months(getNuevosCedearsRows(), ref)
    assert.ok(rows.length > 0)
    assert.ok(rows.every((row) => row.detectedSince >= "2025-11-04"))
  })

  it("groups by month when enough rows", () => {
    const ref = new Date("2026-11-04T12:00:00.000Z")
    const rows = filterNuevosLast12Months(getNuevosCedearsRows(), ref)
    const groups = groupNuevosCedearsByMonth(rows)
    assert.ok(groups.length >= 2)
    assert.match(groups[0].heading, /\d{4}/)
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

  it("buildNuevosCedearsPageModel exposes search for long lists", () => {
    const model = buildNuevosCedearsPageModel(new Date("2026-11-04T12:00:00.000Z"))
    assert.ok(model.count12Months > 60)
    assert.equal(model.needsSearch, true)
  })
})
