import assert from "node:assert/strict"
import test from "node:test"
import {
  buildCedearDetailTitle,
  cedearCompanyLabel,
} from "@/lib/cedear-display"
import { getPrimaryCedearTag, getSimilarCedears } from "@/lib/similar-cedears"
import type { Cedear } from "@/lib/cedears"

function cedear(partial: Partial<Cedear> & Pick<Cedear, "Cedears">): Cedear {
  return {
    Name: "",
    Market: "NYSE",
    Ratio: "1",
    TickerOriginal: partial.Cedears,
    tags: [],
    price: null,
    pctChange: null,
    volume: null,
    usPrice: null,
    priceMep: null,
    priceCcl: null,
    ...partial,
  }
}

test("cedearCompanyLabel prefers Name, then TickerOriginal, then Cedears", () => {
  assert.equal(
    cedearCompanyLabel(
      cedear({ Cedears: "IBIT", Name: "ISHARES BITCOIN TRUST" }),
    ),
    "ISHARES BITCOIN TRUST",
  )
  assert.equal(
    cedearCompanyLabel(cedear({ Cedears: "X", Name: "  ", TickerOriginal: "FOO" })),
    "FOO",
  )
  assert.equal(
    cedearCompanyLabel(cedear({ Cedears: "X", Name: "", TickerOriginal: "" })),
    "X",
  )
})

test("buildCedearDetailTitle adds dividend suffix only when requested", () => {
  const base = cedear({
    Cedears: "IVV",
    Name: "IShares Core S&P 500 ETF",
    Ratio: "692",
  })
  assert.equal(
    buildCedearDetailTitle(base, false),
    "CEDEAR de IShares Core S&P 500 ETF (IVV): precio hoy, ratio 692:1",
  )
  assert.equal(
    buildCedearDetailTitle(base, true),
    "CEDEAR de IShares Core S&P 500 ETF (IVV): precio hoy, ratio 692:1 y dividendos",
  )
})

test("getSimilarCedears matches slug-equivalent tags and excludes self", () => {
  const all = [
    cedear({ Cedears: "A", tags: ["Tech"] }),
    cedear({ Cedears: "B", tags: ["Tech"] }),
    cedear({ Cedears: "C", tags: ["ETFs"] }),
    cedear({ Cedears: "D", tags: ["Minería & Metales"] }),
    cedear({ Cedears: "E", tags: ["Minería y metales"] }),
  ]
  const current = cedear({ Cedears: "A", tags: ["Tech"] })
  const similar = getSimilarCedears(current, all, 8)
  assert.deepEqual(similar.map((c) => c.Cedears), ["B"])
})

test("getSimilarCedears returns empty without a primary tag", () => {
  const current = cedear({ Cedears: "ARCO", tags: [] })
  assert.equal(getPrimaryCedearTag(current), null)
  assert.deepEqual(getSimilarCedears(current, [current]), [])
})
