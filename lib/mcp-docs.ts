import { createElement as h } from "react"
import type { CedearFaq } from "@/lib/cedear-faqs"

export const CHATGPT_MCP_HELP_URL =
  "https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt"

/** Fallback when the earnings cache is unavailable (window end seen in the 30/10/2026 capture). */
export const MCP_EARNINGS_WINDOW_END_FALLBACK = "2027-01-30"

export function formatIsoDayAr(iso: string): string {
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

export const MCP_DOCS_PATH = "/mcp"
export const MCP_DOCS_TITLE =
  "Cómo conectar el MCP de CEDEARs a Claude, Cursor y ChatGPT"
export const MCP_DOCS_DESCRIPTION =
  "Consultá precios en vivo, fichas y balances de CEDEARs desde Claude, Cursor o ChatGPT con el MCP público de cedears.com. Sin registro. Guía paso a paso."
export const MCP_DOCS_H1 = "Conectá cedears.com a tu asistente de IA"
export const MCP_DOCS_LEAD =
  "Un servidor MCP público para consultar CEDEARs: precios en vivo de BYMA, fichas por ticker y balances de las empresas subyacentes. Sin registro ni clave."

/** Same tokens as the /como-comprar-cedears guide (kept local so this PR does not stack on #76). */
export const MCP_SECTION_HEADING_CLASS =
  "text-[length:var(--size-l)] leading-[var(--line-l)] font-semibold tracking-[var(--letter-spacing-l)]"
export const MCP_BODY_CLASS = "max-w-[65ch] text-base leading-relaxed text-foreground"
export const MCP_STEP_NUMBER_CLASS =
  "w-8 shrink-0 font-[family-name:var(--font-brand)] text-[length:var(--size-xxl)] font-semibold leading-none tabular-nums text-foreground"
export const MCP_CARD_CLASS =
  "min-w-0 rounded-[var(--radius-xl)] border border-border bg-card p-6 shadow-[var(--shadow-s)]"

/** Spanish copy per tool; args/types come from TOOL_DEFINITIONS. */
export const MCP_TOOL_COPY: Record<
  string,
  { summary: string; args: Record<string, string>; examplePrompt: string }
> = {
  list_cedears: {
    summary:
      "Lista CEDEARs con precios en vivo de BYMA (ARS, variación, volumen, MEP, CCL, precio justo y prima), con las mismas columnas que el CSV.",
    args: {
      query: "Texto a buscar en ticker, empresa o ticker original.",
      tag: "Etiqueta del CEDEAR (por ejemplo, un sector).",
      limit: "Cantidad de filas, de 1 a 500. Por defecto 50.",
    },
    examplePrompt: "Buscá los CEDEARs de Apple y decime precio en pesos y CCL implícito.",
  },
  get_cedear: {
    summary: "La ficha de un CEDEAR por ticker. Los precios pueden venir en null; nunca se inventan.",
    args: { ticker: "Ticker del CEDEAR; no distingue mayúsculas." },
    examplePrompt: "¿Cuánto cotiza hoy el CEDEAR de Coca-Cola y qué prima tiene?",
  },
  earnings: {
    summary:
      "Balances de las empresas subyacentes para un día o un rango de hasta 31 días, dentro de la ventana cacheada (hoy hasta unos tres meses).",
    args: {
      day: "Un día YYYY-MM-DD (hora de Nueva York). Pisa start/end.",
      start: "Inicio del rango YYYY-MM-DD. Por defecto, hoy.",
      end: "Fin del rango YYYY-MM-DD, máximo 31 días.",
    },
    examplePrompt: "¿Qué empresas con CEDEAR presentan balance hoy?",
  },
}

export function buildMcpFaqs(earningsWindowEndIso: string): CedearFaq[] {
  const windowEnd = formatIsoDayAr(earningsWindowEndIso)
  const outLink = (text: string) =>
    h("a", { href: CHATGPT_MCP_HELP_URL, target: "_blank", rel: "noopener noreferrer", className: "font-medium text-foreground underline underline-offset-4" }, text)
  return [
  {
    question: "¿Qué es este MCP?",
    answer:
      "Un servidor MCP remoto y público en https://cedears.com/mcp que expone datos de CEDEARs para que tu asistente los consulte. Usa HTTP streamable y no pide autenticación.",
  },
  {
    question: "¿Qué datos puedo consultar?",
    answer:
      "Tres herramientas: list_cedears (lista CEDEARs con precios en vivo de BYMA, filtrable por texto, etiqueta o cantidad), get_cedear (la ficha de un CEDEAR por ticker) y earnings (balances de las empresas subyacentes por día o rango de hasta 31 días).",
  },
  {
    question: "¿Necesito registrarme o usar una clave?",
    answer: "No. El servidor es público y no requiere autenticación.",
  },
  {
    question: "¿Cuánto cuestan los datos?",
    answer:
      "Consultar el MCP es gratis. Los precios son los publicados por BYMA y pueden tener demoras; no son una cotización para operar.",
  },
  {
    question: "¿Qué planes de ChatGPT lo permiten?",
    answer:
      "ChatGPT permite conectar servidores MCP propios en los planes Business y Enterprise/Edu. En el plan Pro la conexión es más limitada (solo lectura). Si una herramienta no aparece o falla, revisá qué permite tu plan.",
    answerNode: h(
      "span",
      null,
      "ChatGPT permite conectar servidores MCP propios en los ",
      outLink("planes Business y Enterprise/Edu"),
      ". En el ",
      outLink("plan Pro"),
      " la conexión es más limitada (solo lectura). Si una herramienta no aparece o falla, revisá qué permite tu plan.",
    ),
  },
  {
    question: "¿Los datos están actualizados?",
    answer:
      `Los precios salen de la cotización en vivo de BYMA que consulta el servidor; a veces un precio puede figurar sin dato. Los balances cubren la ventana disponible en el servidor (hoy hasta el ${windowEnd}). Las respuestas de earnings incluyen la fecha del balance; list_cedears y get_cedear devuelven el precio al momento de la consulta, sin fecha propia.`,
  },
  {
    question: "¿Puedo usar los datos en un producto o sitio?",
    answer:
      "Está pensado para consultas personales desde un asistente. Si querés reutilizar los datos a mayor escala, escribinos por email antes.",
  },
  {
    question: "¿Es asesoramiento financiero?",
    answer:
      "No. Es una herramienta de consulta de datos; no recomendamos comprar ni vender ningún instrumento.",
  },
  ]
}

export type McpClientStep = {
  id: string
  name: string
  steps: string[]
  snippet?: string
  docsUrl: string
  docsLabel: string
}

export function buildMcpClientSteps(endpoint: string): McpClientStep[] {
  return [
    {
      id: "claude",
      name: "Claude (web y escritorio)",
      steps: [
        "Abrí Customize › Connectors.",
        "Tocá + Add › Add custom connector.",
        "Poné un nombre (cedears) y pegá la URL del MCP. Sin autenticación.",
      ],
      snippet: endpoint,
      docsUrl:
        "https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp",
      docsLabel: "Guía oficial de Claude",
    },
    {
      id: "claude-code",
      name: "Claude Code",
      steps: ["Corré este comando en tu terminal:"],
      snippet: `claude mcp add --transport http cedears ${endpoint}`,
      docsUrl: "https://code.claude.com/docs/en/mcp",
      docsLabel: "Docs de Claude Code",
    },
    {
      id: "cursor",
      name: "Cursor",
      steps: [
        "Abrí ~/.cursor/mcp.json (global) o .cursor/mcp.json (proyecto).",
        "Sumá el servidor dentro de mcpServers con su url y guardá.",
      ],
      snippet: JSON.stringify({ mcpServers: { cedears: { url: endpoint } } }, null, 2),
      docsUrl: "https://cursor.com/docs/mcp",
      docsLabel: "Docs de Cursor",
    },
    {
      id: "chatgpt",
      name: "ChatGPT (web)",
      steps: [
        "Andá a Plugins › + › Add custom MCP server.",
        "Pegá la URL y elegí No authentication.",
        "Aceptá el aviso, tocá Create as a plugin e invocalo con @ en el chat.",
        "Disponible según tu plan: mirá la pregunta sobre planes más abajo.",
      ],
      snippet: endpoint,
      docsUrl:
        "https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt",
      docsLabel: "Ayuda de OpenAI",
    },
  ]
}
