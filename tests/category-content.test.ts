import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  buildCategoryIntroParts,
  TOP_CATEGORY_SLUGS,
} from "../lib/category-content.ts"

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
})
