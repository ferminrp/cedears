import { CSV_COLUMNS, type Cedear, toMcpRow } from "../cedears"
import {
  INTERNAL_ERROR,
  INVALID_PARAMS,
  isRecord,
  jsonRpcError,
  jsonRpcResult,
  type JsonRpcId,
  type JsonRpcResponse,
} from "./jsonrpc"

export const DEFAULT_LIST_LIMIT = 50
export const MAX_LIST_LIMIT = 500
export const MAX_EARNINGS_RANGE_DAYS = 31

export type EarningsTimelinePayload = {
  days: {
    date: string
    items: {
      cedear: string
      name: string
      market: string
      tickerOriginal: string
      earningsTime: string | null
      isDateConfirmed: boolean
    }[]
  }[]
  totalCedears: number
  dateRange: { start: string; end: string }
}

export type McpDeps = {
  getCedears: () => Promise<Cedear[]>
  getEarningsTimeline: () => Promise<EarningsTimelinePayload>
}

export type ToolDefinition = {
  name: string
  description: string
  inputSchema: Record<string, unknown>
}

const LIST_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    query: {
      type: "string",
      description:
        "Optional case-insensitive substring match on ticker, empresa, or ticker original.",
    },
    tag: {
      type: "string",
      description: "Optional case-insensitive match against a CEDEAR tag.",
    },
    limit: {
      type: "integer",
      minimum: 1,
      maximum: MAX_LIST_LIMIT,
      description: `Max rows to return. Default ${DEFAULT_LIST_LIMIT}, max ${MAX_LIST_LIMIT}.`,
    },
  },
} as const

const GET_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["ticker"],
  properties: {
    ticker: {
      type: "string",
      description: "CEDEAR ticker as listed (lookup is case-insensitive, returned as listed).",
    },
  },
} as const

const EARNINGS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    day: {
      type: "string",
      description:
        "Single calendar day YYYY-MM-DD (America/New_York). Must fall inside the cached earnings window. Overrides start/end.",
    },
    start: {
      type: "string",
      description: "Range start YYYY-MM-DD inclusive. Default: today (ET).",
    },
    end: {
      type: "string",
      description: `Range end YYYY-MM-DD inclusive. Max span ${MAX_EARNINGS_RANGE_DAYS} days.`,
    },
  },
} as const

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: "list_cedears",
    description:
      "List Argentine CEDEARs with live BYMA prices (ARS, var, volume, US, MEP, CCL, fair USD, premium %, tags). Same columns as https://cedears.com/cedears.csv. Prices are numbers or null; never invented. Optional query, tag, and limit.",
    inputSchema: LIST_SCHEMA,
  },
  {
    name: "get_cedear",
    description:
      "One CEDEAR row by ticker (case-insensitive lookup). Returns the ticker as listed. Prices are numbers or null from the live cache; never invented.",
    inputSchema: GET_SCHEMA,
  },
  {
    name: "earnings",
    description:
      "CEDEAR underlying earnings for one day or a short date range (max 31 days) inside the cached /earnings window (today ET through about three months). Dates outside that window are rejected. Default: today in America/New_York. Same SavvyTrader calendar as the site; no extra origin fetch per range.",
    inputSchema: EARNINGS_SCHEMA,
  },
]

export const TOOL_NAMES = TOOL_DEFINITIONS.map((tool) => tool.name)

export const MCP_INSTRUCTIONS =
  "Public unauthenticated CEDEARs MCP. Rows use the same columns as https://cedears.com/cedears.csv. Tickers are returned as listed. Prices come from the live cache and may be null; never invent prices. Human UI: https://cedears.com. On fetch failure the server returns a JSON-RPC error."

type ToolResult =
  | { ok: true; payload: unknown }
  | { ok: false; code: number; message: string; data?: unknown }

function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase()
}

function parseLimit(value: unknown): number | { error: string } {
  if (value === undefined) return DEFAULT_LIST_LIMIT
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return { error: "limit must be an integer" }
  }
  if (value < 1 || value > MAX_LIST_LIMIT) {
    return { error: `limit must be between 1 and ${MAX_LIST_LIMIT}` }
  }
  return value
}

function matchesQuery(cedear: Cedear, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    cedear.Cedears.toLowerCase().includes(q) ||
    cedear.Name.toLowerCase().includes(q) ||
    cedear.TickerOriginal.toLowerCase().includes(q)
  )
}

function matchesTag(cedear: Cedear, tag: string): boolean {
  const needle = tag.trim().toLowerCase()
  if (!needle) return true
  return cedear.tags.some((t) => t.toLowerCase() === needle)
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function isIsoDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false
  const [y, m, d] = value.split("-").map(Number)
  const utc = Date.UTC(y, m - 1, d)
  const dt = new Date(utc)
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  )
}

function todayEastern(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

function daysInclusive(start: string, end: string): number {
  const a = Date.parse(`${start}T00:00:00Z`)
  const b = Date.parse(`${end}T00:00:00Z`)
  return Math.floor((b - a) / 86_400_000) + 1
}

async function listCedears(args: unknown, deps: McpDeps): Promise<ToolResult> {
  if (args !== undefined && !isRecord(args)) {
    return { ok: false, code: INVALID_PARAMS, message: "arguments must be an object" }
  }
  const query = args && "query" in args ? args.query : undefined
  const tag = args && "tag" in args ? args.tag : undefined
  if (query !== undefined && typeof query !== "string") {
    return { ok: false, code: INVALID_PARAMS, message: "query must be a string" }
  }
  if (tag !== undefined && typeof tag !== "string") {
    return { ok: false, code: INVALID_PARAMS, message: "tag must be a string" }
  }
  const limit = parseLimit(args?.limit)
  if (typeof limit === "object") {
    return { ok: false, code: INVALID_PARAMS, message: limit.error }
  }

  let rows
  try {
    rows = await deps.getCedears()
  } catch (error) {
    return {
      ok: false,
      code: INTERNAL_ERROR,
      message: "Failed to load CEDEAR data",
      data: error instanceof Error ? error.message : undefined,
    }
  }

  const filtered = rows.filter((row) => {
    if (query && !matchesQuery(row, query)) return false
    if (tag && !matchesTag(row, tag)) return false
    return true
  })

  return {
    ok: true,
    payload: {
      count: Math.min(filtered.length, limit),
      total: filtered.length,
      columns: CSV_COLUMNS.map((c) => c.label),
      rows: filtered.slice(0, limit).map(toMcpRow),
      ui: "https://cedears.com",
    },
  }
}

async function getCedear(args: unknown, deps: McpDeps): Promise<ToolResult> {
  if (!isRecord(args) || typeof args.ticker !== "string" || args.ticker.trim() === "") {
    return { ok: false, code: INVALID_PARAMS, message: "ticker is required" }
  }

  let rows
  try {
    rows = await deps.getCedears()
  } catch (error) {
    return {
      ok: false,
      code: INTERNAL_ERROR,
      message: "Failed to load CEDEAR data",
      data: error instanceof Error ? error.message : undefined,
    }
  }

  const wanted = normalizeTicker(args.ticker)
  const found = rows.find((row) => normalizeTicker(row.Cedears) === wanted)
  if (!found) {
    return {
      ok: true,
      payload: { found: false, ticker: args.ticker.trim().toUpperCase() },
    }
  }

  return {
    ok: true,
    payload: { found: true, row: toMcpRow(found), ui: "https://cedears.com" },
  }
}

async function earnings(args: unknown, deps: McpDeps): Promise<ToolResult> {
  if (args !== undefined && !isRecord(args)) {
    return { ok: false, code: INVALID_PARAMS, message: "arguments must be an object" }
  }

  const day = args && typeof args.day === "string" ? args.day : undefined
  const startArg = args && typeof args.start === "string" ? args.start : undefined
  const endArg = args && typeof args.end === "string" ? args.end : undefined
  if (args && "day" in args && day === undefined) {
    return { ok: false, code: INVALID_PARAMS, message: "day must be YYYY-MM-DD" }
  }
  if (args && "start" in args && startArg === undefined) {
    return { ok: false, code: INVALID_PARAMS, message: "start must be YYYY-MM-DD" }
  }
  if (args && "end" in args && endArg === undefined) {
    return { ok: false, code: INVALID_PARAMS, message: "end must be YYYY-MM-DD" }
  }

  let start: string
  let end: string
  if (day) {
    if (!isIsoDate(day)) {
      return { ok: false, code: INVALID_PARAMS, message: "day must be YYYY-MM-DD" }
    }
    start = day
    end = day
  } else {
    start = startArg ?? todayEastern()
    end = endArg ?? start
    if (!isIsoDate(start) || !isIsoDate(end)) {
      return { ok: false, code: INVALID_PARAMS, message: "start and end must be YYYY-MM-DD" }
    }
  }

  if (start > end) {
    return { ok: false, code: INVALID_PARAMS, message: "start must be on or before end" }
  }
  if (daysInclusive(start, end) > MAX_EARNINGS_RANGE_DAYS) {
    return {
      ok: false,
      code: INVALID_PARAMS,
      message: `range must be at most ${MAX_EARNINGS_RANGE_DAYS} days`,
    }
  }

  let timeline: EarningsTimelinePayload
  try {
    timeline = await deps.getEarningsTimeline()
  } catch (error) {
    return {
      ok: false,
      code: INTERNAL_ERROR,
      message: "Failed to load earnings calendar",
      data: error instanceof Error ? error.message : undefined,
    }
  }

  const windowStart = timeline.dateRange.start
  const windowEnd = timeline.dateRange.end
  if (start < windowStart || end > windowEnd) {
    return {
      ok: false,
      code: INVALID_PARAMS,
      message: `date is outside the loaded earnings window (${windowStart} to ${windowEnd})`,
      data: { start: windowStart, end: windowEnd },
    }
  }

  const days = timeline.days.filter((d) => d.date >= start && d.date <= end)
  return {
    ok: true,
    payload: {
      start,
      end,
      window: { start: windowStart, end: windowEnd },
      days,
      ui: "https://cedears.com/earnings",
    },
  }
}

const EXECUTORS: Record<
  string,
  (args: unknown, deps: McpDeps) => Promise<ToolResult>
> = {
  list_cedears: listCedears,
  get_cedear: getCedear,
  earnings,
}

export async function callTool(
  name: string,
  args: unknown,
  deps: McpDeps,
): Promise<ToolResult> {
  const exec = EXECUTORS[name]
  if (!exec) {
    return { ok: false, code: INVALID_PARAMS, message: `Unknown tool: ${name}` }
  }
  return exec(args, deps)
}

export function toolCallResponse(id: JsonRpcId, result: ToolResult): JsonRpcResponse {
  if (!result.ok) {
    return jsonRpcError(id, result.code, result.message, result.data)
  }
  const text = JSON.stringify(result.payload, null, 2)
  return jsonRpcResult(id, {
    content: [{ type: "text", text }],
    structuredContent: result.payload,
  })
}
