import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  buildCategoryIntroParts,
  getSiblingCategorySlugs,
  SIBLING_CHIP_MAX,
  SIBLING_CHIP_MIN,
  TOP_CATEGORY_SLUGS,
} from "../lib/category-content.ts"
import { getCategoryIndex } from "../lib/cedear-tags.ts"

type CedearJsonRow = {
  Cedears: string
  TickerOriginal: string
  tags: string[]
}

async function loadCategorySlugCounts(): Promise<
  { slug: string; count: number }[]
> {
  const res = await fetch(
    "https://raw.githubusercontent.com/ferminrp/google-sheets-argento/refs/heads/main/data/cedears.json?v=2",
  )
  assert.equal(res.ok, true, "cedears.json fetch")
  const rows = (await res.json()) as CedearJsonRow[]
  return getCategoryIndex(rows).map((c) => ({ slug: c.slug, count: c.count }))
}

describe("category content top 10", () => {
  it("lists PM order with canonical slugs (farma traffic → salud)", () => {
    assert.deepEqual([...TOP_CATEGORY_SLUGS], [
      "indices-de-estados-unidos",
      "etfs",
      "tecnologia",
      "paises-y-regiones",
      "mercados-emergentes",
      "salud",
      "inteligencia-artificial",
      "industriales",
      "aeroespacial-y-defensa",
      "nuclear-y-uranio",
    ])
  })

  it("indices and etfs intros link SPY and QQQ", () => {
    const ctx = { count: 10, sampleTickers: ["AAA"], slug: "etfs" }
    const indicesParts = buildCategoryIntroParts("indices-de-estados-unidos", {
      ...ctx,
      slug: "indices-de-estados-unidos",
    })
    const etfParts = buildCategoryIntroParts("etfs", ctx)
    for (const parts of [indicesParts, etfParts]) {
      const tickers = parts
        .filter((p) => p.type === "cedear-link")
        .map((p) => (p.type === "cedear-link" ? p.ticker : ""))
      assert.ok(tickers.includes("SPY"))
      assert.ok(tickers.includes("QQQ"))
    }
  })

  it("sibling chips use canonical slugs, count > 0, and fill 6–8 when data allows", async () => {
    const all = await loadCategorySlugCounts()
    const countBySlug = new Map(all.map((c) => [c.slug, c.count]))
    const maxOthers = all.filter((c) => c.count > 0).length - 1
    const minExpected = Math.min(SIBLING_CHIP_MIN, Math.max(0, maxOthers))

    for (const slug of ["tecnologia", ...TOP_CATEGORY_SLUGS]) {
      const siblings = getSiblingCategorySlugs(slug, all)
      assert.ok(
        siblings.length <= SIBLING_CHIP_MAX,
        `${slug}: too many chips (${siblings.length})`,
      )
      if (minExpected >= SIBLING_CHIP_MIN) {
        assert.ok(
          siblings.length >= SIBLING_CHIP_MIN,
          `${slug}: expected ≥${SIBLING_CHIP_MIN}, got ${siblings.join(",")}`,
        )
      } else {
        assert.ok(siblings.length >= minExpected)
      }
      for (const chip of siblings) {
        assert.ok(
          (countBySlug.get(chip) ?? 0) > 0,
          `${slug} chip ${chip} has no CEDEARs`,
        )
        assert.notEqual(chip, slug)
      }
    }

    const techSiblings = getSiblingCategorySlugs("tecnologia", all)
    assert.ok(techSiblings.length >= 6)
    assert.ok(techSiblings.includes("etfs"))
    assert.ok(techSiblings.includes("software-y-cloud"))
  })

  it("resolves legacy page slug tech like tecnologia for chips", () => {
    const all = [
      { slug: "tecnologia", count: 60 },
      { slug: "etfs", count: 59 },
      { slug: "semiconductores", count: 19 },
      { slug: "software-y-cloud", count: 21 },
      { slug: "inteligencia-artificial", count: 15 },
      { slug: "ciberseguridad", count: 5 },
      { slug: "fintech-y-pagos", count: 14 },
      { slug: "medios-y-streaming", count: 17 },
      { slug: "cripto-y-bitcoin", count: 13 },
      { slug: "salud", count: 31 },
      { slug: "bancos", count: 24 },
    ]
    const withLegacyCurated = getSiblingCategorySlugs("tecnologia", all)
    assert.ok(withLegacyCurated.length >= 6)
    const fromLegacy = getSiblingCategorySlugs("tech", all)
    assert.deepEqual(fromLegacy, withLegacyCurated)
  })
})
