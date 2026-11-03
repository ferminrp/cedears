import type { Metadata } from "next"
import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { CedearFaqs } from "@/components/cedear-faqs"
import { CategoryTableFallback } from "@/components/category-table-fallback"
import { CategoryTableSection } from "@/components/category-table-section"
import { SiteFooter, footerLinkClassName } from "@/components/site-footer"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
import { canonicalCategorySlug } from "@/lib/category-redirects"
import {
  buildCategoryFaqs,
  buildCategoryIntroParts,
  categoryPageH1,
  categorySeoDescription,
  categorySeoTitle,
  CATEGORY_GUIDE_LINK,
  categoryListingRobots,
  getCategoryDisplay,
  getSiblingCategorySlugs,
  siblingChipLabel,
  type CategoryIntroPart,
} from "@/lib/category-content"
import { absoluteCanonical } from "@/lib/canonical"
import type { Cedear } from "@/lib/cedears"
import {
  findTagBySlug,
  findTagsBySlug,
  getCategoryIndex,
  getUniqueTags,
  getUniqueTagSlugs,
} from "@/lib/cedear-tags"
import type { CedearFaq } from "@/lib/cedear-faqs"
import { getCedearBases, tryGetCedearsLivePricesFetchedAt } from "@/lib/get-cedears"
import { isKnownCategorySlug } from "@/lib/category-slug-guard"
import { formatRatiosDataDate } from "@/lib/ratios"
import { buildPageOpenGraph, getSiteUrl } from "@/lib/site"
import { cn } from "@/lib/utils"

export const revalidate = 300
export const dynamicParams = false

type PageProps = {
  params: Promise<{ label: string }>
}

function countMatchingBases(
  bases: Awaited<ReturnType<typeof getCedearBases>>,
  matchingTags: string[],
) {
  const tagSet = new Set(matchingTags)
  return bases.filter((c) => c.tags.some((t) => tagSet.has(t))).length
}

export async function generateStaticParams() {
  const bases = await getCedearBases()
  return getUniqueTagSlugs(bases).map(({ slug }) => ({ label: slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { label } = await params
  const bases = await getCedearBases()
  const tags = getUniqueTags(bases)
  const tag = findTagBySlug(tags, label)

  if (!tag) notFound()

  const matchingTags = findTagsBySlug(tags, label)
  const count = countMatchingBases(bases, matchingTags)
  const canonicalSlug = canonicalCategorySlug(label)
  const displayTag = tag
  const fetchedAt = await tryGetCedearsLivePricesFetchedAt()
  const title = categorySeoTitle(canonicalSlug, displayTag)
  const description = categorySeoDescription(
    canonicalSlug,
    count,
    fetchedAt,
    displayTag,
  )
  const canonical = absoluteCanonical(`/categoria/${canonicalSlug}`)

  return {
    title,
    description,
    robots: categoryListingRobots(count),
    alternates: { canonical },
    openGraph: buildPageOpenGraph({ title, description, url: canonical }),
  }
}

function CategoryLead({ parts }: { parts: CategoryIntroPart[] }) {
  return (
    <p className="max-w-[60ch] min-h-[3.25rem] text-pretty text-muted-foreground md:min-h-[3.75rem]">
      {parts.map((part, index) => {
        if (part.type === "text") {
          return <span key={index}>{part.value}</span>
        }
        if (part.type === "cedear-link") {
          return (
            <Link
              key={index}
              href={`/cedear/${part.ticker}`}
              className="underline underline-offset-4 hover:text-foreground"
            >
              {part.ticker}
            </Link>
          )
        }
        return (
          <Link
            key={index}
            href={CATEGORY_GUIDE_LINK.href}
            className="underline underline-offset-4 hover:text-foreground"
          >
            {CATEGORY_GUIDE_LINK.linkText}
          </Link>
        )
      })}
    </p>
  )
}

function CategoryJsonLd({
  slug,
  pageName,
  count,
  cedears,
  faqs,
  tagLabel,
}: {
  slug: string
  pageName: string
  count: number
  cedears: Cedear[]
  faqs: CedearFaq[]
  tagLabel?: string | null
}) {
  const siteUrl = getSiteUrl()
  const pageUrl = `${siteUrl}/categoria/${slug}`
  const breadcrumbName = getCategoryDisplay(slug, tagLabel).h1Theme
  const sorted = [...cedears].sort((a, b) => a.Cedears.localeCompare(b.Cedears))

  const graph: Record<string, unknown>[] = [
    {
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: pageName,
      inLanguage: "es-AR",
      isPartOf: { "@id": `${siteUrl}/#website` },
      breadcrumb: { "@id": `${pageUrl}#breadcrumb` },
      mainEntity: { "@id": `${pageUrl}#list` },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${pageUrl}#breadcrumb`,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Inicio",
          item: `${siteUrl}/`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Categorías",
          item: `${siteUrl}/categorias`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: breadcrumbName.charAt(0).toUpperCase() + breadcrumbName.slice(1),
        },
      ],
    },
    {
      "@type": "ItemList",
      "@id": `${pageUrl}#list`,
      name: pageName,
      numberOfItems: count,
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      itemListElement: sorted.map((c, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${siteUrl}/cedear/${c.Cedears}`,
        name: `${c.Name} (${c.Cedears})`,
      })),
    },
  ]

  if (faqs.length > 0) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    })
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": graph,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

export default async function CategoryPage({ params }: PageProps) {
  const { label } = await params
  const canonicalSlug = canonicalCategorySlug(label)

  let bases: Awaited<ReturnType<typeof getCedearBases>>
  try {
    bases = await getCedearBases()
  } catch {
    if (!(await isKnownCategorySlug(label))) notFound()
    return (
      <>
        <Alert variant="destructive">
          <AlertTitle>Error al cargar los datos</AlertTitle>
          <AlertDescription>
            No se pudo obtener la lista de CEDEARs. Intentá recargar la página en unos
            minutos.
          </AlertDescription>
        </Alert>
        <SiteFooter>
          <Link href="/" className={footerLinkClassName}>
            Volver al listado completo
          </Link>
        </SiteFooter>
      </>
    )
  }

  const tags = getUniqueTags(bases)
  const tag = findTagBySlug(tags, label)
  if (!tag) notFound()

  const matchingTags = findTagsBySlug(tags, label)
  const baseCount = countMatchingBases(bases, matchingTags)
  const matchingTagSet = new Set(matchingTags)
  const basesInCategory = bases
    .filter((c) => c.tags.some((t) => matchingTagSet.has(t)))
    .sort((a, b) => a.Cedears.localeCompare(b.Cedears))
  const categoryIndex = getCategoryIndex(bases)
  const siblingSlugs = getSiblingCategorySlugs(
    canonicalSlug,
    categoryIndex.map((c) => ({ slug: c.slug, count: c.count })),
  )

  const fetchedAt = await tryGetCedearsLivePricesFetchedAt()
  const dateLabelFallback = formatRatiosDataDate(new Date())

  const displayTag = tag
  const h1 = categoryPageH1(canonicalSlug, displayTag)
  const themeSectionTitle = `Todos los CEDEARs de ${getCategoryDisplay(canonicalSlug, displayTag).themeLower}`

  const faqContext = {
    count: basesInCategory.length || baseCount,
    sampleTickers: basesInCategory.slice(0, 5).map((c) => c.Cedears),
    slug: canonicalSlug,
  }
  const introParts = buildCategoryIntroParts(canonicalSlug, faqContext, displayTag)
  const faqs = buildCategoryFaqs(canonicalSlug, faqContext)
  const categoryDisplay = getCategoryDisplay(canonicalSlug, displayTag)
  const breadcrumbLabel =
    categoryDisplay.h1Theme.charAt(0).toUpperCase() +
    categoryDisplay.h1Theme.slice(1)
  const dateLabel = fetchedAt
    ? formatRatiosDataDate(fetchedAt)
    : dateLabelFallback

  const filteredForSchema: Cedear[] = basesInCategory.map((base) => ({
    ...base,
    price: null,
    pctChange: null,
    volume: null,
    usPrice: null,
    priceMep: null,
    priceCcl: null,
  }))

  return (
    <>
      <CategoryJsonLd
        slug={canonicalSlug}
        pageName={h1}
        count={basesInCategory.length || baseCount}
        cedears={filteredForSchema}
        faqs={faqs}
        tagLabel={displayTag}
      />
      <header className="flex flex-col gap-4">
        <nav aria-label="Migas de pan" className="text-xs text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link href="/" className="inline-flex min-h-11 min-w-11 items-center justify-center hover:text-foreground">
                Inicio
              </Link>
            </li>
            <li aria-hidden className="px-0.5">
              /
            </li>
            <li>
              <Link
                href="/categorias"
                className="inline-flex min-h-11 min-w-11 items-center justify-center hover:text-foreground"
              >
                Categorías
              </Link>
            </li>
            <li aria-hidden className="px-0.5">
              /
            </li>
            <li>
              <span
                className="inline-flex min-h-11 items-center font-medium text-foreground"
                aria-current="page"
              >
                {breadcrumbLabel}
              </span>
            </li>
          </ol>
        </nav>
        <h1 className="text-balance text-[length:var(--size-xl)] leading-[var(--line-xl)] font-semibold tracking-[var(--letter-spacing-xl)] md:text-[length:var(--size-xxl)] md:leading-[var(--line-xxl)]">
          {h1}
        </h1>
        <CategoryLead parts={introParts} />
        <p className="text-sm text-muted-foreground">
          {baseCount} CEDEARs · Precios actualizados el {dateLabel}
        </p>
      </header>

      <section
        className="flex min-h-[22rem] flex-col gap-3 md:min-h-[20rem]"
        aria-labelledby="category-table-heading"
      >
        <h2
          id="category-table-heading"
          className="text-[length:var(--size-m)] leading-[var(--line-m)] font-semibold tracking-[var(--letter-spacing-m)]"
        >
          {themeSectionTitle}
        </h2>
        <Suspense fallback={<CategoryTableFallback />}>
          <CategoryTableSection
            matchingTags={matchingTags}
            canonicalSlug={canonicalSlug}
          />
        </Suspense>
      </section>

      {siblingSlugs.length > 0 ? (
        <section className="flex flex-col gap-3" aria-labelledby="sibling-categories-heading">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2
              id="sibling-categories-heading"
              className="text-[length:var(--size-m)] leading-[var(--line-m)] font-semibold tracking-[var(--letter-spacing-m)]"
            >
              Otras categorías
            </h2>
            <Link
              href="/categorias"
              className="inline-flex min-h-11 items-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Ver todas
            </Link>
          </div>
          <ul className="flex flex-wrap gap-2">
            {siblingSlugs.map((s) => {
              const chipTag = findTagBySlug(tags, s)
              return (
              <li key={s}>
                <Link
                  href={`/categoria/${s}`}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "min-h-11 touch-manipulation rounded-[var(--radius-m)]",
                  )}
                >
                  {siblingChipLabel(s, chipTag)}
                </Link>
              </li>
            )})}
          </ul>
        </section>
      ) : null}

      {faqs.length > 0 ? <CedearFaqs faqs={faqs} /> : null}

      <SiteFooter>
        <Link href="/" className={footerLinkClassName}>
          Volver al listado completo
        </Link>
        {" · "}
        Datos de{" "}
        <a
          href="https://data912.com"
          target="_blank"
          rel="noopener noreferrer"
          className={footerLinkClassName}
        >
          data912
        </a>
        .
      </SiteFooter>
    </>
  )
}
