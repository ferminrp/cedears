import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { categoryListingRobots } from "../lib/category-content.ts"

describe("categoryListingRobots", () => {
  it("returns noindex,follow when count is zero", () => {
    assert.deepEqual(categoryListingRobots(0), {
      index: false,
      follow: true,
    })
  })

  it("allows indexing when count is positive", () => {
    assert.equal(categoryListingRobots(1), undefined)
    assert.equal(categoryListingRobots(60), undefined)
  })
})
