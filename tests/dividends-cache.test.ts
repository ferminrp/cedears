import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { cacheDividendsTable } from "../lib/dividends-cache.ts"
import type { DividendsTableData } from "../lib/dividends-shared.ts"

const row = { cedear: "KO" } as DividendsTableData["rows"][number]
const ok: DividendsTableData = { rows: [row], asOfDate: "2026-11-03", loadFailed: false }
const failed: DividendsTableData = { rows: [], asOfDate: "2026-11-03", loadFailed: true }

function sequence(results: Array<DividendsTableData | Error>) {
  let calls = 0
  const load = async () => {
    const next = results[Math.min(calls++, results.length - 1)]
    if (next instanceof Error) throw next
    return next
  }
  return { load, calls: () => calls }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

describe("cacheDividendsTable", () => {
  it("does not cache a failed load, so the next request retries", async () => {
    const source = sequence([failed, ok])
    const get = cacheDividendsTable(source.load, [`t-${Math.random()}`], 86400)

    assert.equal((await get()).loadFailed, true)
    assert.deepEqual((await get()).rows, [row])
    assert.equal(source.calls(), 2)
  })

  it("returns a failed result instead of throwing when the loader throws", async () => {
    const source = sequence([new Error("yahoo down"), ok])
    const get = cacheDividendsTable(source.load, [`t-${Math.random()}`], 86400)

    const data = await get()
    assert.equal(data.loadFailed, true)
    assert.deepEqual(data.rows, [])
    assert.deepEqual((await get()).rows, [row])
  })

  it("keeps the good entry when a later refresh fails", async () => {
    const source = sequence([ok, failed, ok])
    const get = cacheDividendsTable(source.load, [`t-${Math.random()}`], 0.01)

    assert.deepEqual((await get()).rows, [row])
    await sleep(30)
    await get()
    await sleep(5)
    assert.deepEqual((await get()).rows, [row], "good rows survive a failed refresh")
  })
})
