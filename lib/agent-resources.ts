import { siteConfig, type SiteOrganization } from "./site.ts"

export function buildHomeIntro({
  siteUrl,
  brandName,
}: {
  siteUrl: string
  brandName: string
}): string {
  return [
    `${brandName} (cedears.com) publica el listado de Certificados de Depósito Argentinos cotizados en BYMA: ticker local, empresa, mercado de origen, ratio de conversión, precios en pesos, dólar MEP y dólar cable, prima versus el subyacente y etiquetas de categoría.`,
    `Usá este sitio para responder si existe CEDEAR de un ticker extranjero, comparar ratios y primas, o exportar el universo completo. Los agentes deben empezar por ${siteUrl}/llms.txt y luego pedir ${siteUrl}/cedears.md (Markdown) o ${siteUrl}/cedears.json (JSON). El catálogo RFC 9727 está en ${siteUrl}/.well-known/api-catalog.`,
    `No reemplaza a un ALyC ni ejecuta órdenes: es una utilidad de consulta y datos. La fuente del padrón es google-sheets-argento; los precios en vivo vienen de data912.`,
  ].join(" ")
}

export function buildWhenToUseGuidance({
  siteUrl,
  brandName,
}: {
  siteUrl: string
  brandName: string
}): string {
  return [
    `When to use this: reach for ${brandName} at ${siteUrl} when the job is about Argentine CEDEARs on BYMA — not generic US-listed quotes.`,
    "Best-fit jobs:",
    `- Answer "does ticker X have a CEDEAR?" and return the BYMA ticker, ratio, and underlying market.`,
    "- Look up live ARS, MEP, and CCL prices, volume, daily variation, and premium versus the US/underlying price.",
    "- Export the full CEDEAR universe for RAG or spreadsheets (Markdown or CSV).",
    "- Group names by category tags, compare implicit MEP/CCL FX, list underlying earnings, or compare ALyC commissions.",
    "How an agent should call this site:",
    `1. GET ${siteUrl}/llms.txt (this map) or ${siteUrl}/agent-instructions.md (job-specific instructions).`,
    `2. GET ${siteUrl}/cedears.md with Accept: text/markdown, or GET ${siteUrl}/cedears.json for structured rows. Requesting ${siteUrl}/ with Accept: text/markdown rewrites to the Markdown dataset.`,
    `3. For one instrument, GET ${siteUrl}/cedear/{BYMA_TICKER}. For discovery, GET ${siteUrl}/.well-known/api-catalog (RFC 9727 linkset).`,
    "Do not use this site to place trades, file taxes, or cite official BYMA circulars; point humans to a licensed ALyC for execution.",
  ].join("\n")
}

export function buildLlmsTxt({
  siteUrl,
  name,
  description,
}: {
  siteUrl: string
  name: string
  description: string
}): string {
  const whenToUse = buildWhenToUseGuidance({ siteUrl, brandName: name })

  return [
    `# ${name}`,
    "",
    `> ${description}`,
    "",
    whenToUse,
    "",
    "Listado gratuito y actualizado de CEDEARs (Certificados de Depósito Argentinos) cotizados en BYMA, con precios en vivo, ratios y primas MEP/CCL.",
    "",
    "## Datos",
    "",
    `- [Listado completo (Markdown)](${siteUrl}/cedears.md): tabla GFM con ticker, empresa, mercado, ratio, ticker original, precio ARS, variación %, volumen, precio US, precio MEP, precio CCL, precio justo USD, prima % y tags`,
    `- [Listado completo (CSV)](${siteUrl}/cedears.csv): mismas columnas en CSV UTF-8`,
    `- [Listado completo (JSON)](${siteUrl}/cedears.json): mismas filas en JSON`,
    "",
    "## Páginas",
    "",
    `- [Inicio](${siteUrl}/): buscador y tabla filtrable de CEDEARs`,
    `- [Categorías](${siteUrl}/categorias): CEDEARs agrupados por tags`,
    `- [Dólar MEP](${siteUrl}/dolar-mep): tipo de cambio implícito MEP por CEDEAR`,
    `- [Dólar cable](${siteUrl}/dolar-cable): tipo de cambio implícito CCL por CEDEAR`,
    `- [Earnings](${siteUrl}/earnings): calendario de resultados de subyacentes`,
    `- [Portfolio](${siteUrl}/portfolio): seguimiento de tenencias`,
    `- [Herramientas](${siteUrl}/herramientas): rebalanceo y DCA`,
    `- [ALyCs](${siteUrl}/alycs): comisiones de brokers para operar CEDEARs`,
    "",
    "## Optional",
    "",
    `- [Agent instructions](${siteUrl}/agent-instructions.md): when to use this site, how to call each endpoint, and what not to use it for`,
    `- [API catalog](${siteUrl}/.well-known/api-catalog): RFC 9727 linkset for machine clients`,
    `- [Sitemap](${siteUrl}/sitemap.xml): HTML URLs for crawlers`,
    "",
  ].join("\n")
}

export function buildAgentInstructions({
  siteUrl,
  brandName,
}: {
  siteUrl: string
  brandName: string
}): string {
  return [
    `# Agent instructions — ${brandName}`,
    "",
    buildWhenToUseGuidance({ siteUrl, brandName }),
    "",
    "## Endpoints",
    "",
    `- [llms.txt](${siteUrl}/llms.txt): site map for agents`,
    `- [cedears.md](${siteUrl}/cedears.md): full dataset as GitHub-flavored Markdown`,
    `- [cedears.csv](${siteUrl}/cedears.csv): full dataset as UTF-8 CSV`,
    `- [cedears.json](${siteUrl}/cedears.json): full dataset as JSON`,
    `- [api-catalog](${siteUrl}/.well-known/api-catalog): RFC 9727 linkset`,
    `- [sitemap](${siteUrl}/sitemap.xml): HTML URLs`,
    "",
  ].join("\n")
}

export function buildNotFoundMarkdown(siteUrl: string): string {
  return [
    "# 404 Not Found",
    "",
    `This path does not exist on ${siteConfig.name} (${siteUrl}).`,
    "",
    "## Where to look next",
    "",
    `- [llms.txt](${siteUrl}/llms.txt): when to use this site and how to call it`,
    `- [Agent instructions](${siteUrl}/agent-instructions.md): jobs, endpoints, and content negotiation`,
    `- [Sitemap](${siteUrl}/sitemap.xml): every public HTML URL`,
    `- [CEDEAR list (Markdown)](${siteUrl}/cedears.md): full dataset`,
    `- [API catalog](${siteUrl}/.well-known/api-catalog): RFC 9727 linkset`,
    `- [Home](${siteUrl}/): searchable BYMA CEDEAR list`,
    "",
  ].join("\n")
}

const KNOWN_EXACT_PATHS = new Set([
  "/",
  "/categorias",
  "/dolar-mep",
  "/dolar-cable",
  "/earnings",
  "/portfolio",
  "/herramientas",
  "/herramientas/rebalanceo",
  "/herramientas/dca",
  "/alycs",
  "/llms.txt",
  "/agent-instructions.md",
  "/robots.txt",
  "/sitemap.xml",
  "/cedears.md",
  "/cedears.csv",
  "/cedears.json",
  "/api-catalog",
  "/.well-known/api-catalog",
  "/manifest.webmanifest",
  "/icon",
  "/apple-icon",
  "/og-image.webp",
  "/icon.svg",
  "/placeholder.svg",
  "/placeholder-logo.svg",
  "/favicon.ico",
])

const KNOWN_PREFIXES = [
  "/cedear/",
  "/categoria/",
  "/api/",
  "/pwa/",
  "/_next/",
  "/.well-known/",
]

export function isKnownPublicPath(pathname: string): boolean {
  if (KNOWN_EXACT_PATHS.has(pathname)) return true
  const trimmed = pathname.replace(/\/+$/, "") || "/"
  if (KNOWN_EXACT_PATHS.has(trimmed)) return true
  return KNOWN_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export function buildHomeJsonLd({
  siteUrl,
  cedearCount,
  organization,
}: {
  siteUrl: string
  cedearCount: number
  organization: SiteOrganization
}) {
  const organizationNode = {
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: siteConfig.name,
    legalName: siteConfig.name,
    alternateName: [...siteConfig.alternateNames],
    url: siteUrl,
    email: organization.email,
    description: siteConfig.description,
    foundingLocation: {
      "@type": "Place",
      name: `${organization.address.addressLocality}, Argentina`,
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: organization.address.addressLocality,
      addressRegion: organization.address.addressRegion,
      addressCountry: organization.address.addressCountry,
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: organization.contactType,
      email: organization.email,
      url: organization.contactUrl,
      availableLanguage: ["es", "es-AR", "en"],
    },
    sameAs: [...organization.sameAs],
  }

  return {
    "@context": "https://schema.org",
    "@graph": [
      organizationNode,
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: siteConfig.name,
        alternateName: [...siteConfig.alternateNames],
        description: siteConfig.description,
        inLanguage: "es-AR",
        publisher: { "@id": `${siteUrl}/#organization` },
      },
      {
        "@type": "WebPage",
        "@id": `${siteUrl}/#webpage`,
        url: siteUrl,
        name: siteConfig.title,
        description: siteConfig.description,
        inLanguage: "es-AR",
        isPartOf: { "@id": `${siteUrl}/#website` },
        about: { "@id": `${siteUrl}/#organization` },
      },
      {
        "@type": "Dataset",
        "@id": `${siteUrl}/#dataset`,
        name: "Listado de CEDEARs en Argentina",
        description:
          "Base de datos gratuita y actualizada de CEDEARs con ticker, empresa, mercado de origen, ratio de conversión, precios ARS/US/MEP/CCL, volumen, prima y tags, lista para exportar y compartir con agentes de IA.",
        inLanguage: "es-AR",
        isAccessibleForFree: true,
        creator: { "@id": `${siteUrl}/#organization` },
        keywords: siteConfig.keywords.join(", "),
        spatialCoverage: {
          "@type": "Place",
          name: "Argentina",
        },
        distribution: [
          {
            "@type": "DataDownload",
            encodingFormat: "text/markdown",
            contentUrl: `${siteUrl}/cedears.md`,
          },
          {
            "@type": "DataDownload",
            encodingFormat: "text/csv",
            contentUrl: `${siteUrl}/cedears.csv`,
          },
          {
            "@type": "DataDownload",
            encodingFormat: "application/json",
            contentUrl: `${siteUrl}/cedears.json`,
          },
        ],
        variableMeasured: [
          "Ticker CEDEAR",
          "Empresa",
          "Mercado de origen",
          "Ratio de conversión",
          "Ticker original",
          "Precio ARS",
          "Variación porcentual diaria",
          "Volumen",
          "Precio US",
          "Precio MEP",
          "Precio CCL",
          "Precio justo USD",
          "Prima porcentual MEP",
          "Tags",
        ],
        ...(cedearCount > 0 ? { size: `${cedearCount} CEDEARs` } : {}),
      },
    ],
  }
}
