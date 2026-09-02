import { getCedears } from "@/lib/get-cedears"
import { getEarningsTimeline } from "@/lib/earnings"
import {
  handleMcpGet,
  handleMcpOptions,
  handleMcpPost,
} from "@/lib/mcp/http"
import { type McpDeps } from "@/lib/mcp/tools"

const deps: McpDeps = {
  getCedears,
  getEarningsTimeline,
}

export async function GET(request: Request) {
  return handleMcpGet(request)
}

export async function POST(request: Request) {
  return handleMcpPost(request, deps)
}

export function OPTIONS() {
  return handleMcpOptions()
}
