import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  canonicalTagSlugFromTag,
  countCedearsForCategorySlug,
  findTagBySlug,
  findTagsBySlug,
  getUniqueTagSlugs,
  slugifyTag,
} from "../lib/cedear-tags.ts"

const FIXTURE = [
  { tags: ["Tech"], TickerOriginal: "AAPL" },
  { tags: ["Tech"], TickerOriginal: "MSFT" },
  { tags: ["Tecnología"], TickerOriginal: "NVDA" },
  { tags: ["Cripto"], TickerOriginal: "COIN" },
  { tags: ["Cripto & Bitcoin"], TickerOriginal: "MSTR" },
  { tags: ["Minería & Metales"], TickerOriginal: "FCX" },
  { tags: ["Minería y metales"], TickerOriginal: "NEM" },
]

describe("cedear-tags slug aliases", () => {
  it("slugifyTag distinguishes Tech vs Tecnología raw slugs", () => {
    assert.equal(slugifyTag("Tech"), "tech")
    assert.equal(slugifyTag("Tecnología"), "tecnologia")
  })

  it("findTagsBySlug(tecnologia) merges Tech and Tecnología", () => {
    const tags = ["Tech", "Tecnología", "Cripto", "Cripto & Bitcoin"]
    const matching = findTagsBySlug(tags, "tecnologia")
    assert.deepEqual(matching.sort(), ["Tech", "Tecnología"])
  })

  it("findTagsBySlug(tech) resolves via canonical slug", () => {
    const tags = ["Tech", "Tecnología"]
    assert.equal(findTagsBySlug(tags, "tech").length, 2)
  })

  it("findTagsBySlug(cripto-y-bitcoin) merges Cripto variants", () => {
    const tags = ["Cripto", "Cripto & Bitcoin"]
    assert.deepEqual(findTagsBySlug(tags, "cripto-y-bitcoin").sort(), [
      "Cripto",
      "Cripto & Bitcoin",
    ])
  })

  it("findTagBySlug prefers display tag for tecnologia", () => {
    const tags = ["Tech", "Tecnología"]
    assert.equal(findTagBySlug(tags, "tecnologia"), "Tecnología")
  })

  it("countCedearsForCategorySlug matches merged tags", () => {
    assert.equal(countCedearsForCategorySlug(FIXTURE, "tecnologia"), 3)
    assert.equal(countCedearsForCategorySlug(FIXTURE, "cripto-y-bitcoin"), 2)
    assert.equal(countCedearsForCategorySlug(FIXTURE, "mineria-y-metales"), 2)
  })

  it("getUniqueTagSlugs emits canonical slugs only", () => {
    const slugs = getUniqueTagSlugs(FIXTURE).map((e) => e.slug)
    assert.ok(slugs.includes("tecnologia"))
    assert.ok(!slugs.includes("tech"))
    assert.ok(slugs.includes("cripto-y-bitcoin"))
    assert.ok(!slugs.includes("cripto"))
  })

  it("canonicalTagSlugFromTag maps Tech to tecnologia", () => {
    assert.equal(canonicalTagSlugFromTag("Tech"), "tecnologia")
    assert.equal(canonicalTagSlugFromTag("Cripto"), "cripto-y-bitcoin")
  })
})
