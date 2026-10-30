import type { Metadata } from "next"
import { CedearFaqs } from "@/components/cedear-faqs"
import { CopyButton } from "@/components/copy-button"
import { JsonHighlight } from "@/components/json-highlight"
import { SiteFooter, footerLinkClassName } from "@/components/site-footer"
import {
  MCP_BODY_CLASS,
  MCP_CARD_CLASS,
  MCP_DOCS_DESCRIPTION,
  MCP_DOCS_H1,
  MCP_DOCS_LEAD,
  MCP_DOCS_PATH,
  MCP_DOCS_TITLE,
  MCP_FAQS,
  MCP_SECTION_HEADING_CLASS,
  MCP_STEP_NUMBER_CLASS,
  MCP_TOOL_COPY,
  buildMcpClientSteps,
} from "@/lib/mcp-docs"
import { MCP_CAPTURED_AT_ISO, MCP_CAPTURED_AT_LABEL, MCP_TOOL_CAPTURES } from "@/lib/mcp-docs-captures"
import { TOOL_DEFINITIONS } from "@/lib/mcp/tools"
import { buildPageOpenGraph, getSiteUrl } from "@/lib/site"

// Served at /mcp via middleware content negotiation (Accept: text/html, not text/event-stream).
export const metadata: Metadata = {
  title: MCP_DOCS_TITLE,
  description: MCP_DOCS_DESCRIPTION,
  alternates: { canonical: MCP_DOCS_PATH },
  openGraph: buildPageOpenGraph({
    title: MCP_DOCS_TITLE,
    description: MCP_DOCS_DESCRIPTION,
    url: MCP_DOCS_PATH,
  }),
}

type SchemaProp = { type?: string; description?: string }

function FaqJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: MCP_FAQS.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  }
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
  )
}

const preClass =
  "min-w-0 max-h-80 overflow-auto overscroll-contain rounded-[var(--radius-m)] border border-border bg-[#fbfbfc] p-4 text-[13px] leading-relaxed"
const outLinkClass =
  "inline-flex min-h-11 items-center font-medium text-foreground underline underline-offset-4"

export default function McpDocsPage() {
  const endpoint = `${getSiteUrl()}${MCP_DOCS_PATH}`
  const clients = buildMcpClientSteps(endpoint)

  return (
    <>
      <FaqJsonLd />
      <header className="flex min-w-0 flex-col gap-4">
        <h1 className="text-balance text-[length:var(--size-xl)] leading-[var(--line-xl)] font-semibold tracking-[var(--letter-spacing-xl)] md:text-[length:var(--size-xxl)] md:leading-[var(--line-xxl)]">
          {MCP_DOCS_H1}
        </h1>
        <p className="max-w-[65ch] text-pretty text-muted-foreground">{MCP_DOCS_LEAD}</p>
        <div className="flex min-w-0 items-stretch gap-2">
          <div className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-[var(--radius-m)] bg-muted px-4 py-3 font-mono text-[15px]" translate="no">
            {endpoint}
          </div>
          <CopyButton value={endpoint} label="Copiar URL del MCP" />
        </div>
        <p className="text-sm text-muted-foreground">
          HTTP streamable (JSON-RPC 2.0 por POST) · Sin autenticación · {TOOL_DEFINITIONS.length} herramientas ·{" "}
          <a href="/cedears.csv" className={footerLinkClassName}>CSV</a> ·{" "}
          <a href="/.well-known/mcp.json" className={footerLinkClassName} translate="no">/.well-known/mcp.json</a>
        </p>
      </header>

      <section aria-labelledby="herramientas" className="flex min-w-0 flex-col gap-4">
        <h2 id="herramientas" className={MCP_SECTION_HEADING_CLASS}>Herramientas</h2>
        {TOOL_DEFINITIONS.map((tool) => {
          const copy = MCP_TOOL_COPY[tool.name]
          const capture = MCP_TOOL_CAPTURES[tool.name]
          const props = (tool.inputSchema.properties ?? {}) as Record<string, SchemaProp>
          const required = new Set((tool.inputSchema.required as string[] | undefined) ?? [])
          return (
            <article key={tool.name} className={`${MCP_CARD_CLASS} flex flex-col gap-4`}>
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold"><code translate="no">{tool.name}</code></h3>
                <p className={`${MCP_BODY_CLASS} text-muted-foreground`}>{copy?.summary ?? tool.description}</p>
              </div>
              <div className="min-w-0">
                <h4 className="mb-2 text-sm font-medium">Argumentos</h4>
                <dl className="divide-y border-y border-border text-sm">
                  {Object.entries(props).map(([name, p]) => (
                    <div key={name} className="grid min-w-0 grid-cols-[7rem_1fr] gap-3 py-2 md:grid-cols-[9rem_1fr]">
                      <dt className="min-w-0 break-words font-mono" translate="no">{name}</dt>
                      <dd className="min-w-0">
                        <span className="block text-[13px] text-muted-foreground">
                          {p.type}{required.has(name) ? " · obligatorio" : " · opcional"}
                        </span>
                        {copy?.args[name] ?? p.description}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
              {copy ? (
                <figure className="border-l-2 border-border pl-4">
                  <figcaption className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ejemplo de pedido</figcaption>
                  <blockquote className="mt-1 text-base">“{copy.examplePrompt}”</blockquote>
                </figure>
              ) : null}
              {capture ? (
                <details className="group min-w-0">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-medium marker:content-none [&::-webkit-details-marker]:hidden">
                    <span aria-hidden className="transition-transform group-open:rotate-90 motion-reduce:transition-none">▸</span>
                    Ver respuesta de ejemplo
                  </summary>
                  <p className="mb-2 text-xs text-muted-foreground">
                    Respuesta real capturada el{" "}
                    <time dateTime={MCP_CAPTURED_AT_ISO}>{MCP_CAPTURED_AT_LABEL}</time>, recortada ·{" "}
                    <code translate="no">tools/call {tool.name} {JSON.stringify(capture.args)}</code>
                  </p>
                  <pre className={preClass}><JsonHighlight value={capture.response} /></pre>
                </details>
              ) : null}
            </article>
          )
        })}
      </section>

      <section aria-labelledby="conectar" className="flex min-w-0 flex-col gap-4">
        <h2 id="conectar" className={MCP_SECTION_HEADING_CLASS}>Cómo conectarlo</h2>
        <ol className="flex min-w-0 flex-col gap-4">
          {clients.map((c, i) => (
            <li key={c.id} className={`${MCP_CARD_CLASS} flex gap-4`}>
              <span aria-hidden className={MCP_STEP_NUMBER_CLASS}>{i + 1}</span>
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <h3 className="text-lg font-semibold">{c.name}</h3>
                <ul className={`${MCP_BODY_CLASS} list-disc pl-5`}>
                  {c.steps.map((s) => <li key={s}>{s}</li>)}
                </ul>
                {c.snippet ? (
                  <div className="relative min-w-0">
                    <pre className={`${preClass} pr-[100px]`}><code translate="no">{c.snippet}</code></pre>
                    <CopyButton value={c.snippet} label={`Copiar configuración de ${c.name}`} className="absolute right-2 top-2" />
                  </div>
                ) : null}
                <a href={c.docsUrl} target="_blank" rel="noopener noreferrer" className={outLinkClass}>
                  {c.docsLabel} ↗
                </a>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className={MCP_CARD_CLASS}>
        <CedearFaqs faqs={MCP_FAQS} />
      </div>

      <SiteFooter>
        Datos de{" "}
        <a href="https://github.com/ferminrp/google-sheets-argento" target="_blank" rel="noopener noreferrer" className={footerLinkClassName}>google-sheets-argento</a>{" "}
        y precios en vivo de{" "}
        <a href="https://data912.com" target="_blank" rel="noopener noreferrer" className={footerLinkClassName}>data912</a>.
      </SiteFooter>
    </>
  )
}
