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
import { LEGACY_CATEGORY_SLUGS } from "../lib/category-redirects.ts"

const FIXTURE = [
  { tags: ["Tech"], TickerOriginal: "AAPL" },
  { tags: ["Tech"], TickerOriginal: "MSFT" },
  { tags: ["Tecnología"], TickerOriginal: "NVDA" },
  { tags: ["Cripto"], TickerOriginal: "COIN" },
  { tags: ["Cripto & Bitcoin"], TickerOriginal: "MSTR" },
  { tags: ["Minería & Metales"], TickerOriginal: "FCX" },
  { tags: ["Minería y metales"], TickerOriginal: "NEM" },
  { tags: ["Farma & Biotecnología"], TickerOriginal: "PFE" },
  { tags: ["Salud"], TickerOriginal: "JNJ" },
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
    assert.equal(countCedearsForCategorySlug(FIXTURE, "salud"), 2)
  })

  it("findTagsBySlug(salud) merges Farma & Biotecnología", () => {
    const tags = ["Farma & Biotecnología", "Salud"]
    assert.deepEqual(findTagsBySlug(tags, "salud").sort(), [
      "Farma & Biotecnología",
      "Salud",
    ])
    assert.deepEqual(findTagsBySlug(tags, "farma-y-biotecnologia").sort(), [
      "Farma & Biotecnología",
      "Salud",
    ])
  })

  it("getUniqueTagSlugs emits canonical slugs only", () => {
    const slugs = getUniqueTagSlugs(FIXTURE).map((e) => e.slug)
    assert.ok(slugs.includes("tecnologia"))
    assert.ok(!slugs.includes("tech"))
    assert.ok(slugs.includes("cripto-y-bitcoin"))
    assert.ok(!slugs.includes("cripto"))
    assert.ok(slugs.includes("salud"))
    assert.ok(!slugs.includes("farma-y-biotecnologia"))
  })

  it("canonicalTagSlugFromTag maps legacy tag slugs to canonical URLs", () => {
    assert.equal(canonicalTagSlugFromTag("Tech"), "tecnologia")
    assert.equal(canonicalTagSlugFromTag("Cripto"), "cripto-y-bitcoin")
    assert.equal(
      canonicalTagSlugFromTag("Farma & Biotecnología"),
      "salud",
    )
  })
})

describe("category sitemap slugs", () => {
  it("excludes legacy duplicate paths (301 targets only in sitemap)", () => {
    const slugs = getUniqueTagSlugs(FIXTURE).map((e) => e.slug)
    for (const legacy of LEGACY_CATEGORY_SLUGS) {
      assert.ok(
        !slugs.includes(legacy),
        `sitemap must not list legacy slug ${legacy}`,
      )
    }
    assert.ok(slugs.includes("tecnologia"))
    assert.ok(slugs.includes("salud"))
    assert.ok(slugs.includes("cripto-y-bitcoin"))
  })
})
