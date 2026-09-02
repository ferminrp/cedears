export type McpGetIntent = { kind: "descriptor" } | { kind: "sse" }

/**
 * MCP clients GET with Accept including text/event-stream to open SSE.
 * Ordinary GET (browsers, curl, discovery) must still receive the JSON descriptor.
 * Do not 406: the SDK transport does that; we 405 SSE GET like Comparapix.
 */
export function mcpGetIntent(accept: string | null): McpGetIntent {
  if (!accept) return { kind: "descriptor" }
  if (accept.toLowerCase().includes("text/event-stream")) {
    return { kind: "sse" }
  }
  return { kind: "descriptor" }
}
