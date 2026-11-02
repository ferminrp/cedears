import type { CedearFaq } from "@/lib/cedear-faqs"
import { formatRatiosDataDate } from "@/lib/ratios"

/** Switch to /como-comprar-cedears when #76 merges (SPEC). */
export const CATEGORY_GUIDE_LINK = {
  href: "/alycs",
  linkText: "en qué ALyC comprarlos",
} as const

export const TOP_CATEGORY_SLUGS = [
  "tecnologia",
  "etfs",
  "salud",
  "petroleo-y-gas",
  "bancos",
  "mineria-y-metales",
  "consumo-basico",
  "software-y-cloud",
  "semiconductores",
  "retail-y-e-commerce",
] as const

export type TopCategorySlug = (typeof TOP_CATEGORY_SLUGS)[number]

export function isTopCategorySlug(slug: string): slug is TopCategorySlug {
  return (TOP_CATEGORY_SLUGS as readonly string[]).includes(slug)
}

export type CategoryDisplay = {
  /** Running text, e.g. "tecnología" */
  themeLower: string
  /** H1 fragment after "CEDEARs de" */
  h1Theme: string
}

export const CATEGORY_DISPLAY: Record<string, CategoryDisplay> = {
  tecnologia: { themeLower: "tecnología", h1Theme: "tecnología" },
  etfs: { themeLower: "ETFs", h1Theme: "ETFs" },
  salud: { themeLower: "salud", h1Theme: "salud" },
  "petroleo-y-gas": { themeLower: "petróleo y gas", h1Theme: "petróleo y gas" },
  bancos: { themeLower: "bancos", h1Theme: "bancos" },
  "mineria-y-metales": {
    themeLower: "minería y metales",
    h1Theme: "minería y metales",
  },
  "consumo-basico": { themeLower: "consumo básico", h1Theme: "consumo básico" },
  "software-y-cloud": {
    themeLower: "software y cloud",
    h1Theme: "software y cloud",
  },
  semiconductores: { themeLower: "semiconductores", h1Theme: "semiconductores" },
  "retail-y-e-commerce": {
    themeLower: "retail y e-commerce",
    h1Theme: "retail y e-commerce",
  },
}

export function getCategoryDisplay(slug: string): CategoryDisplay {
  return (
    CATEGORY_DISPLAY[slug] ?? {
      themeLower: slug.replace(/-/g, " "),
      h1Theme: slug.replace(/-/g, " "),
    }
  )
}

export function categoryPageH1(slug: string): string {
  const { h1Theme } = getCategoryDisplay(slug)
  return `CEDEARs de ${h1Theme}`
}

export function categorySeoTitle(slug: string): string {
  const { h1Theme } = getCategoryDisplay(slug)
  return `CEDEARs de ${h1Theme}: precios y ratios hoy`
}

export function categorySeoDescription(
  slug: string,
  count: number,
  fetchedAt: Date | null,
): string {
  const { themeLower } = getCategoryDisplay(slug)
  const dateLabel = fetchedAt
    ? formatRatiosDataDate(fetchedAt)
    : "hoy"
  return `${count} CEDEARs de ${themeLower} con precio en pesos y ratio de conversión, actualizados al ${dateLabel}. Datos de cedears.com.`
}

const RATIO_FAQ_ANSWER =
  "El ratio indica cuántos CEDEARs equivalen a una acción del activo subyacente en el mercado de origen. Por ejemplo, un ratio 10:1 significa que diez CEDEARs representan una acción."

export type CategoryFaqContext = {
  count: number
  sampleTickers: string[]
  slug: string
}

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

type IntroBuilder = (ctx: CategoryFaqContext) => string

const CUSTOM_INTROS: Partial<Record<TopCategorySlug, IntroBuilder>> = {
  tecnologia: () =>
    `Las empresas tech que podés comprar en pesos desde Argentina: Apple, Microsoft, Nvidia y más. Mirá el ratio y el precio de cada una, o mirá ${CATEGORY_GUIDE_LINK.linkText}.`,
  etfs: () =>
    `Fondos que replican un índice o un sector, como SPY, QQQ o EEM, operables en pesos desde Argentina. Con un solo CEDEAR te diversificás. Mirá ratio y precio, o mirá ${CATEGORY_GUIDE_LINK.linkText}.`,
  salud: () =>
    "Farmacéuticas, dispositivos médicos y servicios de salud listados en EE.UU., operables en pesos desde Argentina. Mirá ratio y precio de cada CEDEAR, o mirá en qué ALyC comprarlos.",
  "petroleo-y-gas": () =>
    "Energía y petroleras con CEDEAR en BYMA. Compará ratio y precio en pesos, o mirá en qué ALyC comprarlos.",
  bancos: () =>
    "Entidades financieras globales en pesos argentinos. Revisá ratio y precio de cada CEDEAR, o mirá en qué ALyC comprarlos.",
  "mineria-y-metales": () =>
    "Mineras y metalúrgicas con acciones en EE.UU. y certificados locales. Mirá ratio y precio, o mirá en qué ALyC comprarlos.",
  "consumo-basico": () =>
    "Alimentos, bebidas y consumo de primera necesidad. Consultá ratio y precio en pesos, o mirá en qué ALyC comprarlos.",
  "software-y-cloud": () =>
    "Empresas de software y servicios en la nube con CEDEAR en Argentina. Mirá ratio y precio, o mirá en qué ALyC comprarlos.",
  semiconductores: () =>
    "Fabricantes de chips y equipamiento del sector. Compará ratio y precio en pesos, o mirá en qué ALyC comprarlos.",
  "retail-y-e-commerce": () =>
    "Retail y comercio electrónico global en pesos. Mirá ratio y precio de cada CEDEAR, o mirá en qué ALyC comprarlos.",
}

export function buildCategoryIntro(
  slug: string,
  ctx: CategoryFaqContext,
): string {
  if (isTopCategorySlug(slug) && CUSTOM_INTROS[slug]) {
    return CUSTOM_INTROS[slug]!(ctx)
  }
  const { themeLower } = getCategoryDisplay(slug)
  return `Todos los CEDEARs de ${themeLower} que podés comprar en pesos desde Argentina, con su ratio y precio actualizado. Mirá en qué ALyC comprarlos.`
}

type FaqBuilder = (ctx: CategoryFaqContext) => CedearFaq[]

const CUSTOM_FAQS: Partial<Record<TopCategorySlug, FaqBuilder>> = {
  tecnologia: (ctx) => {
    const { themeLower } = getCategoryDisplay(ctx.slug)
    const sample = tickerSamplePhrase(ctx.sampleTickers)
    return [
      {
        question: `¿Qué CEDEARs de ${themeLower} hay?`,
        answer: `Hoy hay ${ctx.count}, entre ellos ${sample}. La tabla de arriba los lista todos.`,
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
  salud: (ctx) => defaultThemeFaqs(ctx),
  "petroleo-y-gas": (ctx) => defaultThemeFaqs(ctx),
  bancos: (ctx) => defaultThemeFaqs(ctx),
  "mineria-y-metales": (ctx) => defaultThemeFaqs(ctx),
  "consumo-basico": (ctx) => defaultThemeFaqs(ctx),
  "software-y-cloud": (ctx) => defaultThemeFaqs(ctx),
  semiconductores: (ctx) => defaultThemeFaqs(ctx),
  "retail-y-e-commerce": (ctx) => defaultThemeFaqs(ctx),
}

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

export function buildCategoryFaqs(
  slug: string,
  ctx: CategoryFaqContext,
): CedearFaq[] {
  if (!isTopCategorySlug(slug)) return []
  const builder = CUSTOM_FAQS[slug] ?? defaultThemeFaqs
  return builder(ctx)
}

/** Curated sibling chips per theme; fallback computed in getSiblingCategories. */
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
    "indices-de-ee-uu",
    "mercados-emergentes",
    "mercados-desarrollados",
    "paises-y-regiones",
    "commodities",
    "oro-y-plata",
    "apalancados",
  ],
}

export function getSiblingCategorySlugs(
  slug: string,
  allSlugs: { slug: string; count: number }[],
): string[] {
  const curated = CATEGORY_SIBLING_SLUGS[slug as TopCategorySlug]
  if (curated) {
    const known = new Set(allSlugs.map((e) => e.slug))
    return curated.filter((s) => known.has(s) && s !== slug).slice(0, 8)
  }
  return allSlugs
    .filter((e) => e.slug !== slug)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((e) => e.slug)
}

export function siblingChipLabel(slug: string): string {
  const display = getCategoryDisplay(slug)
  return display.h1Theme.charAt(0).toUpperCase() + display.h1Theme.slice(1)
}
