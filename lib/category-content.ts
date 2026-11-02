import type { CedearFaq } from "@/lib/cedear-faqs"
import { resolveCategorySlug } from "@/lib/cedear-tags"
import { formatRatiosDataDate } from "@/lib/ratios"

/** Switch to /como-comprar-cedears when #76 merges (SPEC). */
export const CATEGORY_GUIDE_LINK = {
  href: "/alycs",
  linkText: "en qué ALyC comprarlos",
} as const

/** PM/SEO top 10 (GSC 28d); canonical slugs (`farma-y-biotecnologia` → `salud`). */
export const TOP_CATEGORY_SLUGS = [
  "indices-de-estados-unidos",
  "etfs",
  "tecnologia",
  "paises-y-regiones",
  "mercados-emergentes",
  "salud",
  "inteligencia-artificial",
  "industriales",
  "aeroespacial-y-defensa",
  "nuclear-y-uranio",
] as const

export type TopCategorySlug = (typeof TOP_CATEGORY_SLUGS)[number]

export function isTopCategorySlug(slug: string): slug is TopCategorySlug {
  return (TOP_CATEGORY_SLUGS as readonly string[]).includes(slug)
}

export type CategoryDisplay = {
  themeLower: string
  h1Theme: string
}

export const CATEGORY_DISPLAY: Record<string, CategoryDisplay> = {
  "indices-de-estados-unidos": {
    themeLower: "índices de Estados Unidos",
    h1Theme: "índices de Estados Unidos",
  },
  etfs: { themeLower: "ETFs", h1Theme: "ETFs" },
  tecnologia: { themeLower: "tecnología", h1Theme: "tecnología" },
  "paises-y-regiones": {
    themeLower: "países y regiones",
    h1Theme: "países y regiones",
  },
  "mercados-emergentes": {
    themeLower: "mercados emergentes",
    h1Theme: "mercados emergentes",
  },
  salud: { themeLower: "salud y farma", h1Theme: "salud y farma" },
  "inteligencia-artificial": {
    themeLower: "inteligencia artificial",
    h1Theme: "inteligencia artificial",
  },
  industriales: { themeLower: "industriales", h1Theme: "industriales" },
  "aeroespacial-y-defensa": {
    themeLower: "aeroespacial y defensa",
    h1Theme: "aeroespacial y defensa",
  },
  "nuclear-y-uranio": {
    themeLower: "nuclear y uranio",
    h1Theme: "nuclear y uranio",
  },
}

export function tagLabelToThemeLower(tagLabel: string): string {
  return tagLabel
    .replace(/\s*&\s*/g, " y ")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("es-AR")
    .replace(/\bev\b/g, "EV")
}

export function getCategoryDisplay(
  slug: string,
  tagLabel?: string | null,
): CategoryDisplay {
  if (CATEGORY_DISPLAY[slug]) return CATEGORY_DISPLAY[slug]
  if (tagLabel) {
    const themeLower = tagLabelToThemeLower(tagLabel)
    return { themeLower, h1Theme: themeLower }
  }
  return {
    themeLower: slug.replace(/-/g, " "),
    h1Theme: slug.replace(/-/g, " "),
  }
}

export function categoryPageH1(slug: string, tagLabel?: string | null): string {
  const { h1Theme } = getCategoryDisplay(slug, tagLabel)
  return `CEDEARs de ${h1Theme}`
}

export function categorySeoTitle(slug: string, tagLabel?: string | null): string {
  const { h1Theme } = getCategoryDisplay(slug, tagLabel)
  return `CEDEARs de ${h1Theme}: precios y ratios hoy`
}

export function categorySeoDescription(
  slug: string,
  count: number,
  fetchedAt: Date | null,
  tagLabel?: string | null,
): string {
  const { themeLower } = getCategoryDisplay(slug, tagLabel)
  const dateLabel = fetchedAt ? formatRatiosDataDate(fetchedAt) : "hoy"
  return `${count} CEDEARs de ${themeLower} con precio en pesos y ratio de conversión, actualizados al ${dateLabel}. Datos de cedears.com.`
}

const RATIO_FAQ_ANSWER =
  "El ratio indica cuántos CEDEARs equivalen a una acción del activo subyacente en el mercado de origen. Por ejemplo, un ratio 10:1 significa que diez CEDEARs representan una acción."

export type CategoryFaqContext = {
  count: number
  sampleTickers: string[]
  slug: string
}

export type CategoryIntroPart =
  | { type: "text"; value: string }
  | { type: "cedear-link"; ticker: string }
  | { type: "guide-link" }

function tickerSamplePhrase(tickers: string[]): string {
  if (tickers.length === 0) return "varios tickers"
  if (tickers.length === 1) return tickers[0]
  if (tickers.length === 2) return `${tickers[0]} y ${tickers[1]}`
  const head = tickers.slice(0, -1).join(", ")
  return `${head} y ${tickers[tickers.length - 1]}`
}

function comprarFaqAnswer(themeLower: string): string {
  return `Elegí un ALyC, abrí una cuenta comitente y buscá el ticker en la plataforma. En esta web tenés el listado de ${themeLower} con ratio y precio; podés ver ${CATEGORY_GUIDE_LINK.linkText} en la guía de ALyCs.`
}

function introWithGuide(leadParts: CategoryIntroPart[]): CategoryIntroPart[] {
  return [
    ...leadParts,
    { type: "text", value: " Mirá " },
    { type: "guide-link" },
    { type: "text", value: "." },
  ]
}

const CUSTOM_INTRO_PARTS: Partial<
  Record<TopCategorySlug, CategoryIntroPart[]>
> = {
  "indices-de-estados-unidos": introWithGuide([
    {
      type: "text",
      value:
        "CEDEARs que replican índices de EE.UU., como el S&P 500 con ",
    },
    { type: "cedear-link", ticker: "SPY" },
    { type: "text", value: " o el Nasdaq con " },
    { type: "cedear-link", ticker: "QQQ" },
    {
      type: "text",
      value: ", operables en pesos desde Argentina.",
    },
  ]),
  etfs: introWithGuide([
    {
      type: "text",
      value:
        "Fondos que replican un índice o un sector. Entre los más buscados están ",
    },
    { type: "cedear-link", ticker: "SPY" },
    { type: "text", value: " y " },
    { type: "cedear-link", ticker: "QQQ" },
    {
      type: "text",
      value:
        "; con un solo CEDEAR te diversificás en pesos desde Argentina.",
    },
  ]),
  tecnologia: [
    {
      type: "text",
      value:
        "Las empresas tech que podés comprar en pesos desde Argentina: Apple, Microsoft, Nvidia y más. Mirá el ratio y el precio de cada una, o mirá ",
    },
    { type: "guide-link" },
    { type: "text", value: "." },
  ],
  "paises-y-regiones": introWithGuide([
    {
      type: "text",
      value:
        "ETFs y acciones ligadas a un país o región (Brasil, China, Europa y más), operables en pesos desde Argentina.",
    },
  ]),
  "mercados-emergentes": introWithGuide([
    {
      type: "text",
      value:
        "Exposición a economías emergentes vía CEDEARs en BYMA. Compará ratio y precio de cada uno.",
    },
  ]),
  salud: introWithGuide([
    {
      type: "text",
      value:
        "Farmacéuticas, biotecnología y salud listadas en EE.UU., unificadas en esta categoría (incluye el listado histórico de farma y biotecnología).",
    },
  ]),
  "inteligencia-artificial": introWithGuide([
    {
      type: "text",
      value:
        "Empresas vinculadas a IA, chips y software, con CEDEAR en Argentina. Revisá ratio y precio en pesos.",
    },
  ]),
  industriales: introWithGuide([
    {
      type: "text",
      value:
        "Manufactura, transporte y servicios industriales con acciones en EE.UU. y certificados locales.",
    },
  ]),
  "aeroespacial-y-defensa": introWithGuide([
    {
      type: "text",
      value:
        "Aerolíneas, defensa y equipamiento aeroespacial operables en pesos desde Argentina.",
    },
  ]),
  "nuclear-y-uranio": introWithGuide([
    {
      type: "text",
      value:
        "Mineras de uranio y empresas del ciclo nuclear con CEDEAR en BYMA.",
    },
  ]),
}

export function buildCategoryIntroParts(
  slug: string,
  _ctx: CategoryFaqContext,
  tagLabel?: string | null,
): CategoryIntroPart[] {
  if (isTopCategorySlug(slug) && CUSTOM_INTRO_PARTS[slug]) {
    return CUSTOM_INTRO_PARTS[slug]!
  }
  const { themeLower } = getCategoryDisplay(slug, tagLabel)
  return introWithGuide([
    {
      type: "text",
      value: `Todos los CEDEARs de ${themeLower} que podés comprar en pesos desde Argentina, con su ratio y precio actualizado.`,
    },
  ])
}

/** Plain-text fallback (tests, JSON-LD). */
export function buildCategoryIntro(
  slug: string,
  ctx: CategoryFaqContext,
): string {
  return buildCategoryIntroParts(slug, ctx)
    .map((part) => {
      if (part.type === "text") return part.value
      if (part.type === "cedear-link") return part.ticker
      return CATEGORY_GUIDE_LINK.linkText
    })
    .join("")
}

type FaqBuilder = (ctx: CategoryFaqContext) => CedearFaq[]

function defaultThemeFaqs(ctx: CategoryFaqContext): CedearFaq[] {
  const { themeLower } = getCategoryDisplay(ctx.slug)
  const sample = tickerSamplePhrase(ctx.sampleTickers)
  return [
    {
      question: `¿Qué CEDEARs de ${themeLower} hay?`,
      answer: `Hay ${ctx.count} en esta categoría, entre ellos ${sample}. La tabla los lista completos.`,
    },
    {
      question: `¿Cómo compro un CEDEAR de ${themeLower}?`,
      answer: comprarFaqAnswer(themeLower),
    },
    {
      question: "¿Qué es el ratio?",
      answer: RATIO_FAQ_ANSWER,
    },
  ]
}

const CUSTOM_FAQS: Partial<Record<TopCategorySlug, FaqBuilder>> = {
  "indices-de-estados-unidos": (ctx) => {
    const sample = tickerSamplePhrase(ctx.sampleTickers)
    return [
      {
        question: "¿Qué CEDEARs de índices de EE.UU. hay?",
        answer: `Hay ${ctx.count} en esta categoría, entre ellos ${sample}. SPY y QQQ suelen ser los más consultados; la tabla los lista todos.`,
      },
      {
        question: "¿Cómo compro un CEDEAR de un índice?",
        answer: comprarFaqAnswer("índices de Estados Unidos"),
      },
      {
        question: "¿Qué es el ratio?",
        answer: RATIO_FAQ_ANSWER,
      },
    ]
  },
  etfs: () => [
    {
      question: "¿Qué es un CEDEAR de ETF?",
      answer:
        "Un certificado que representa cuotapartes de un ETF que cotiza en EE.UU.",
    },
    {
      question: "¿Cuál conviene?",
      answer:
        "Depende de qué querés replicar. Esta tabla no es una recomendación.",
    },
    {
      question: "¿Qué es el ratio?",
      answer: RATIO_FAQ_ANSWER,
    },
  ],
  tecnologia: (ctx) => {
    const sample = tickerSamplePhrase(ctx.sampleTickers)
    return [
      {
        question: "¿Qué CEDEARs de tecnología hay?",
        answer: `Hoy hay ${ctx.count}, entre ellos ${sample}. La tabla de arriba los lista todos.`,
      },
      {
        question: "¿Cómo compro un CEDEAR de tecnología?",
        answer: comprarFaqAnswer("tecnología"),
      },
      {
        question: "¿Qué es el ratio?",
        answer: RATIO_FAQ_ANSWER,
      },
    ]
  },
  "paises-y-regiones": (ctx) => defaultThemeFaqs(ctx),
  "mercados-emergentes": (ctx) => defaultThemeFaqs(ctx),
  salud: (ctx) => {
    const sample = tickerSamplePhrase(ctx.sampleTickers)
    return [
      {
        question: "¿Qué CEDEARs de salud y farma hay?",
        answer: `Hay ${ctx.count} en esta categoría (Salud y Farma & Biotecnología), entre ellos ${sample}. La tabla los lista todos.`,
      },
      {
        question: "¿Cómo compro un CEDEAR de salud?",
        answer: comprarFaqAnswer("salud y farma"),
      },
      {
        question: "¿Qué es el ratio?",
        answer: RATIO_FAQ_ANSWER,
      },
    ]
  },
  "inteligencia-artificial": (ctx) => defaultThemeFaqs(ctx),
  industriales: (ctx) => defaultThemeFaqs(ctx),
  "aeroespacial-y-defensa": (ctx) => defaultThemeFaqs(ctx),
  "nuclear-y-uranio": (ctx) => defaultThemeFaqs(ctx),
}

export function buildCategoryFaqs(
  slug: string,
  ctx: CategoryFaqContext,
): CedearFaq[] {
  if (!isTopCategorySlug(slug)) return []
  const builder = CUSTOM_FAQS[slug] ?? defaultThemeFaqs
  return builder(ctx)
}

export const CATEGORY_SIBLING_SLUGS: Partial<
  Record<TopCategorySlug, readonly string[]>
> = {
  tecnologia: [
    "etfs",
    "semiconductores",
    "software-y-cloud",
    "inteligencia-artificial",
    "ciberseguridad",
    "fintech-y-pagos",
    "medios-y-streaming",
  ],
  etfs: [
    "indices-de-estados-unidos",
    "mercados-emergentes",
    "mercados-desarrollados",
    "paises-y-regiones",
    "commodities",
    "oro-y-plata",
    "apalancados",
  ],
  "indices-de-estados-unidos": [
    "etfs",
    "mercados-desarrollados",
    "apalancados",
    "oro-y-plata",
  ],
}

export const SIBLING_CHIP_MIN = 6
export const SIBLING_CHIP_MAX = 8

function slugCountsByCanonical(
  allSlugs: { slug: string; count: number }[],
): Map<string, number> {
  const byCanonical = new Map<string, number>()
  for (const { slug, count } of allSlugs) {
    const canonical = resolveCategorySlug(slug)
    byCanonical.set(canonical, count)
  }
  return byCanonical
}

function isValidSiblingChip(
  candidate: string,
  canonical: string,
  counts: Map<string, number>,
): boolean {
  const resolved = resolveCategorySlug(candidate)
  if (resolved === canonical) return false
  return (counts.get(resolved) ?? 0) > 0
}

export function getSiblingCategorySlugs(
  slug: string,
  allSlugs: { slug: string; count: number }[],
): string[] {
  const canonical = resolveCategorySlug(slug)
  const counts = slugCountsByCanonical(allSlugs)
  const picked = new Set<string>()
  const result: string[] = []

  const push = (raw: string) => {
    const resolved = resolveCategorySlug(raw)
    if (!isValidSiblingChip(resolved, canonical, counts) || picked.has(resolved)) {
      return
    }
    picked.add(resolved)
    result.push(resolved)
  }

  const curated = CATEGORY_SIBLING_SLUGS[canonical as TopCategorySlug]
  const available = [...counts.entries()]
    .filter(([s, c]) => s !== canonical && c > 0)
    .sort((a, b) => b[1] - a[1])

  if (curated) {
    for (const entry of curated) {
      if (result.length >= SIBLING_CHIP_MAX) break
      push(entry)
    }
  }

  for (const [s] of available) {
    if (result.length >= SIBLING_CHIP_MAX) break
    push(s)
  }

  return result.slice(0, SIBLING_CHIP_MAX)
}

export function siblingChipLabel(slug: string, tagLabel?: string | null): string {
  const display = getCategoryDisplay(slug, tagLabel)
  const label = display.h1Theme
  return label.charAt(0).toUpperCase() + label.slice(1)
}
