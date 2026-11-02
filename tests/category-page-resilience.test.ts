import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { tryLoad } from "../lib/try-load.ts"

describe("category page live price resilience", () => {
  it("tryLoad returns null when the loader throws (category date line)", async () => {
    const result = await tryLoad(async () => {
      throw new Error("live payload unavailable")
    })
    assert.equal(result, null)
  })

  it("tryLoad returns loader value on success", async () => {
    const when = new Date("2026-11-02T12:00:00.000Z")
    const result = await tryLoad(async () => when)
    assert.equal(result, when)
  })
})
