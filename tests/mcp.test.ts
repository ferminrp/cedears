import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { type Cedear } from "../lib/cedears.ts"
import { mcpGetIntent } from "../lib/mcp/accept.ts"
import { handleJsonRpcBody } from "../lib/mcp/handler.ts"
import { CORS_HEADERS, handleMcpGet, handleMcpOptions, mcpDescriptor } from "../lib/mcp/http.ts"
import { type McpDeps } from "../lib/mcp/tools.ts"

function fixtureAal(): Cedear {
  return {
    Cedears: "AAL",
    Name: "American Airlines Group Inc",
    Market: "NASDAQ",
    Ratio: "2",
    TickerOriginal: "AAL",
    tags: ["Viajes & Turismo"],
    price: 10700,
    pctChange: -2.72,
    volume: 22613,
    usPrice: 13.44,
    priceMep: 7,
    priceCcl: 7,
  }
}

function fixtureAaba(): Cedear {
  return {
    Cedears: "AABA",
    Name: "Altaba Inc.",
    Market: "NASDAQ",
    Ratio: "3",
    TickerOriginal: "AABA",
    tags: [],
    price: null,
    pctChange: null,
    volume: null,
    usPrice: null,
    priceMep: null,
    priceCcl: null,
  }
}

function deps(overrides: Partial<McpDeps> = {}): McpDeps {
  return {
    getCedears: async () => [fixtureAaba(), fixtureAal()],
    getEarningsInRange: async (start, end) => ({
      days: [
        {
          date: start,
          items: [
            {
              cedear: "AAL",
              name: "American Airlines Group Inc",
              market: "NASDAQ",
              tickerOriginal: "AAL",
              earningsTime: "08:00",
              isDateConfirmed: true,
            },
          ],
        },
      ],
      totalCedears: 1,
      dateRange: { start, end },
    }),
    ...overrides,
  }
}

async function rpc(method: string, params?: unknown, extra?: Partial<McpDeps>) {
  const body = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method,
    ...(params !== undefined ? { params } : {}),
  })
  const outcome = await handleJsonRpcBody(body, deps(extra), "cedears")
  assert.equal(outcome.kind, "response")
  if (outcome.kind !== "response") throw new Error("expected response")
  return outcome.body
}

describe("mcp Accept", () => {
  it("treats missing Accept as descriptor GET", () => {
    assert.equal(mcpGetIntent(null).kind, "descriptor")
    assert.equal(mcpGetIntent("application/json").kind, "descriptor")
    assert.equal(mcpGetIntent("*/*").kind, "descriptor")
  })

  it("treats text/event-stream as SSE GET (405, not 406)", () => {
    assert.equal(
      mcpGetIntent("application/json, text/event-stream").kind,
      "sse",
    )
  })
})

describe("mcp JSON-RPC", () => {
  it("initialize", async () => {
    const body = await rpc("initialize", {
      protocolVersion: "2025-03-26",
      capabilities: {},
      clientInfo: { name: "test", version: "0" },
    })
    assert.equal(body.error, undefined)
    const result = body.result as {
      protocolVersion: string
      serverInfo: { name: string }
      capabilities: { tools: Record<string, never> }
    }
    assert.equal(result.protocolVersion, "2025-03-26")
    assert.equal(result.serverInfo.name, "cedears")
    assert.deepEqual(result.capabilities, { tools: {} })
  })

  it("tools/list includes list_cedears, get_cedear, earnings", async () => {
    const body = await rpc("tools/list")
    const names = body.result.tools.map((t: { name: string }) => t.name)
    assert.deepEqual(names, ["list_cedears", "get_cedear", "earnings"])
  })

  it("list_cedears returns CSV columns and AAL", async () => {
    const body = await rpc("tools/call", {
      name: "list_cedears",
      arguments: { query: "AAL" },
    })
    assert.equal(body.error, undefined)
    const payload = body.result.structuredContent
    assert.equal(payload.total, 1)
    assert.equal(payload.rows[0].Ticker, "AAL")
    assert.equal(payload.rows[0]["Precio ARS"], 10700)
    assert.equal(payload.rows[0]["Precio justo USD"], 6.72)
    assert.ok(payload.columns.includes("Prima %"))
    assert.ok(payload.columns.includes("Tags"))
  })

  it("get_cedear returns AAL as listed", async () => {
    const body = await rpc("tools/call", {
      name: "get_cedear",
      arguments: { ticker: "aal" },
    })
    assert.equal(body.error, undefined)
    const payload = body.result.structuredContent
    assert.equal(payload.found, true)
    assert.equal(payload.row.Ticker, "AAL")
    assert.equal(payload.row.Empresa, "American Airlines Group Inc")
    assert.equal(payload.row["Var. %"], -2.72)
  })

  it("earnings fetches the requested day instead of clipping a default window", async () => {
    let seen: { start: string; end: string } | undefined
    const body = await rpc(
      "tools/call",
      { name: "earnings", arguments: { day: "2026-08-01" } },
      {
        getEarningsInRange: async (start, end) => {
          seen = { start, end }
          return {
            days: [
              {
                date: start,
                items: [
                  {
                    cedear: "AAL",
                    name: "American Airlines Group Inc",
                    market: "NASDAQ",
                    tickerOriginal: "AAL",
                    earningsTime: null,
                    isDateConfirmed: true,
                  },
                ],
              },
            ],
            totalCedears: 1,
            dateRange: { start, end },
          }
        },
      },
    )
    assert.equal(body.error, undefined)
    assert.deepEqual(seen, { start: "2026-08-01", end: "2026-08-01" })
    const payload = body.result.structuredContent
    assert.equal(payload.start, "2026-08-01")
    assert.equal(payload.days[0].date, "2026-08-01")
  })

  it("returns JSON-RPC error when CEDEAR fetch fails", async () => {
    const body = await rpc(
      "tools/call",
      { name: "get_cedear", arguments: { ticker: "AAL" } },
      {
        getCedears: async () => {
          throw new Error("upstream down")
        },
      },
    )
    assert.equal(body.result, undefined)
    assert.equal(body.error?.code, -32603)
    assert.match(body.error?.message ?? "", /Failed to load CEDEAR data/)
  })

  it("parse error is -32700", async () => {
    const outcome = await handleJsonRpcBody("not-json", deps(), "cedears")
    assert.equal(outcome.kind, "parse_error")
    if (outcome.kind !== "parse_error") throw new Error("expected parse_error")
    assert.equal(outcome.body.error?.code, -32700)
  })
})

describe("mcp HTTP shell", () => {
  it("OPTIONS is 204 with open CORS", () => {
    const res = handleMcpOptions()
    assert.equal(res.status, 204)
    assert.equal(res.headers.get("Access-Control-Allow-Origin"), "*")
    assert.equal(res.headers.get("Access-Control-Allow-Methods"), CORS_HEADERS["Access-Control-Allow-Methods"])
  })

  it("GET without SSE Accept returns descriptor", async () => {
    const res = handleMcpGet(new Request("http://localhost:3000/mcp"))
    assert.equal(res.status, 200)
    const json = await res.json()
    assert.equal(json.name, "cedears")
    assert.equal(json.transport, "streamable-http")
    assert.deepEqual(json.tools, ["list_cedears", "get_cedear", "earnings"])
  })

  it("GET with text/event-stream is 405 not 406", () => {
    const res = handleMcpGet(
      new Request("http://localhost:3000/mcp", {
        headers: { Accept: "application/json, text/event-stream" },
      }),
    )
    assert.equal(res.status, 405)
    assert.notEqual(res.status, 406)
  })

  it("descriptor lists tools from the registry", () => {
    const d = mcpDescriptor("https://cedears.com")
    assert.equal(d.csv, "https://cedears.com/cedears.csv")
    assert.equal(d.ui, "https://cedears.com")
  })
})
