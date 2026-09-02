import { getSiteUrl } from "../site"
import { mcpGetIntent } from "./accept"
import { handleJsonRpcBody } from "./handler"
import { TOOL_NAMES, type McpDeps } from "./tools"

export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Accept, MCP-Protocol-Version, Mcp-Session-Id, Last-Event-ID",
  "Access-Control-Expose-Headers": "Mcp-Session-Id, MCP-Protocol-Version",
  "Cache-Control": "no-store",
}

export function mcpDescriptor(siteUrl: string) {
  return {
    name: "cedears",
    transport: "streamable-http",
    mcp: "POST JSON-RPC 2.0 to this URL (initialize, tools/list, tools/call). Auth: none.",
    csv: `${siteUrl}/cedears.csv`,
    json: `${siteUrl}/cedears.json`,
    ui: siteUrl,
    tools: TOOL_NAMES,
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Vary: "Accept",
      ...CORS_HEADERS,
    },
  })
}

export function handleMcpOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      ...CORS_HEADERS,
      Allow: "GET, POST, OPTIONS",
    },
  })
}

export function handleMcpGet(request: Request): Response {
  const intent = mcpGetIntent(request.headers.get("accept"))
  if (intent.kind === "sse") {
    return new Response(JSON.stringify({ error: "SSE not supported; POST JSON-RPC" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Allow: "GET, POST, OPTIONS",
        Vary: "Accept",
        ...CORS_HEADERS,
      },
    })
  }
  return jsonResponse(mcpDescriptor(getSiteUrl()))
}

export async function handleMcpPost(
  request: Request,
  deps: McpDeps,
): Promise<Response> {
  const raw = await request.text()
  const outcome = await handleJsonRpcBody(raw, deps, "cedears")
  if (outcome.kind === "ack") {
    return new Response(null, { status: 202, headers: CORS_HEADERS })
  }
  return jsonResponse(outcome.body)
}

export function mcpWellKnownDocument(siteUrl: string) {
  return {
    name: "cedears",
    description:
      "Public unauthenticated MCP for Argentine CEDEARs. Live prices from the same cache as cedears.com.",
    endpoint: `${siteUrl}/mcp`,
    transport: "streamable-http",
  }
}
