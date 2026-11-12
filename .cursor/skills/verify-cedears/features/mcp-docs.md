# MCP connection guide (`/mcp`)

Spanish documentation for connecting assistants to the public CEDEARs MCP. Browsers that ask for HTML on the same URL as the JSON-RPC endpoint get the docs page; API clients keep the existing `/mcp` behavior.

## Sub-features

- `mcp-accept-html` — `GET /mcp` with `Accept: text/html` (and without `text/event-stream`) rewrites to the docs page; response is `text/html`, `Cache-Control: no-store`, `Vary: Accept`.
- `mcp-accept-json` — `GET /mcp` with `application/json`, bare `GET`, or `POST` JSON-RPC unchanged (descriptor JSON, `tools/list`, etc.).
- `mcp-sse-405` — `Accept` containing `text/event-stream` (alone or with `text/html`) → HTTP 405 (same as pre-docs).
- `mcp-canonical` — docs live at canonical `/mcp`; `/mcp-docs` → 301 to `/mcp`.
- `mcp-hero-copy` — H1 **Conectá cedears.com a tu asistente de IA**; mono URL with horizontal scroll and **Copiar** button (≥44px, green **✓ Copiado** with `aria-live`).
- `mcp-tools-section` — tool cards from `TOOL_DEFINITIONS` (Spanish copy in `lib/mcp-docs.ts`).
- `mcp-setup-steps` — numbered steps for Claude, Claude Code, Cursor, ChatGPT with copyable snippets and official links.
- `mcp-faq` — eight FAQs via `CedearFaqs` + FAQPage JSON-LD in the page HTML.
- `mcp-discovery` — `/mcp` in sitemap; footer and home link to the guide.

## How to get to it (user POV)

- Open `/mcp` in a normal browser (default `Accept` includes `text/html`).
- Or follow **MCP** / connection links on home or footer.
- Assistants use `https://cedears.com/mcp` as the remote `streamable-http` URL (`server.json` in repo root for the MCP Registry).

## Driving it with Playwright

Preconditions:

- `VERIFY_BASE_URL` serves the app; smoke can run without Yahoo/dividendos data.

- **HTML negotiation.** `page.goto(\`${VERIFY_BASE_URL}/mcp\`)` (Playwright sends browser Accept). Expect H1 **Conectá cedears.com a tu asistente de IA**.
- **Overflow and touch.** Harness opens all `<details>`, asserts no horizontal overflow, and touch targets ≥44px on main actions at 390, 768, 1024, 1440 (`mcp-{width}.png`).
- **HTTP smoke (no browser).** Harness `smokeMcp` asserts HTML vs JSON vs SSE, `POST tools/list`, sitemap lists `/mcp`, and HTML responses are `no-store`.

## Gotchas

- Never cache HTML on `/mcp`: a shared URL serves both docs and the MCP descriptor.
- Registry metadata (`server.json`) is validated in `pnpm test` (`tests/server-json.test.ts`), not in the browser harness.
- FAQ copy includes **sin fecha propia** for update timing; do not expect legacy “Cada respuesta del servidor indica su fecha” wording.
