import { getSiteUrl } from "@/lib/site"
import { CORS_HEADERS, mcpWellKnownDocument } from "@/lib/mcp/http"

export const revalidate = 3600

export function GET() {
  return new Response(JSON.stringify(mcpWellKnownDocument(getSiteUrl())), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...CORS_HEADERS,
    },
  })
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      ...CORS_HEADERS,
      Allow: "GET, OPTIONS",
    },
  })
}
