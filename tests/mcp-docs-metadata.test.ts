import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, it } from "node:test"

import { MCP_DOCS_DESCRIPTION, MCP_DOCS_TITLE } from "../lib/mcp-docs.ts"
import { mcpWellKnownDocument } from "../lib/mcp/http.ts"

describe("MCP docs metadata and discovery", () => {
  it("well-known includes registry icon", () => {
    const doc = mcpWellKnownDocument("https://cedears.com") as {
      icons: { src: string; mimeType: string }[]
    }
    assert.equal(doc.icons[0]?.src, "https://cedears.com/mcp-icon-512.png")
    assert.equal(doc.icons[0]?.mimeType, "image/png")
  })

  it("mcp-docs page exports matching twitter title/description", () => {
    const pagePath = join(
      import.meta.dirname,
      "..",
      "app/(site)/mcp-docs/page.tsx",
    )
    const source = readFileSync(pagePath, "utf8")
    assert.match(source, /twitter:\s*\{/)
    assert.match(source, new RegExp(`title:\\s*MCP_DOCS_TITLE`))
    assert.match(source, new RegExp(`description:\\s*MCP_DOCS_DESCRIPTION`))
    assert.equal(MCP_DOCS_TITLE.length > 10, true)
    assert.equal(MCP_DOCS_DESCRIPTION.length > 20, true)
  })
})