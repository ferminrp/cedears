import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, it } from "node:test"

const SCHEMA_URL =
  "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json"
const SERVER_JSON_PATH = join(import.meta.dirname, "..", "server.json")

describe("server.json (MCP Registry)", () => {
  it("validates against the official server.schema.json", async () => {
    const [{ default: Ajv }, { default: addFormats }] = await Promise.all([
      import("ajv"),
      import("ajv-formats"),
    ])

    const schemaResponse = await fetch(SCHEMA_URL)
    assert.equal(schemaResponse.status, 200, "fetch MCP server schema")
    const schema = (await schemaResponse.json()) as Record<string, unknown>

    const ajv = new Ajv({ strict: false, allErrors: true })
    addFormats(ajv)
    const validate = ajv.compile(schema)

    const serverJson = JSON.parse(
      readFileSync(SERVER_JSON_PATH, "utf8"),
    ) as unknown

    const valid = validate(serverJson)
    assert.equal(
      valid,
      true,
      validate.errors?.map((e) => `${e.instancePath} ${e.message}`).join("; ") ??
        "unknown validation error",
    )
  })

  it("points the remote transport at production MCP", () => {
    const serverJson = JSON.parse(readFileSync(SERVER_JSON_PATH, "utf8")) as {
      name: string
      version: string
      remotes: { type: string; url: string }[]
    }
    assert.equal(serverJson.name, "io.github.ferminrp/cedears")
    assert.equal(serverJson.version, "1.0.0")
    assert.deepEqual(serverJson.remotes, [
      {
        type: "streamable-http",
        url: "https://cedears.com/mcp",
      },
    ])
  })
})
