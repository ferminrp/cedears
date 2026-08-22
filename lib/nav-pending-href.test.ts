import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { pathFromHref, pendingMatchesPath } from "./nav-pending-href.ts"

describe("pathFromHref", () => {
  it("strips query and hash from string hrefs", () => {
    assert.equal(pathFromHref("/cedear/AAPL"), "/cedear/AAPL")
    assert.equal(pathFromHref("/categorias?tag=tech#top"), "/categorias")
    assert.equal(pathFromHref({ pathname: "/herramientas/dca" }), "/herramientas/dca")
  })
})

describe("pendingMatchesPath", () => {
  it("treats home as an exact match and prefixes for nested routes", () => {
    assert.equal(
      pendingMatchesPath({ pendingHref: "/", pathname: "/" }),
      true,
    )
    assert.equal(
      pendingMatchesPath({ pendingHref: "/", pathname: "/alycs" }),
      false,
    )
    assert.equal(
      pendingMatchesPath({
        pendingHref: "/herramientas",
        pathname: "/herramientas/dca",
      }),
      true,
    )
  })
})
