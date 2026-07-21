import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { CedearsList } from "@/components/cedears-list"
import { SiteNav } from "@/components/site-nav"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  categoryDescription,
  categoryPath,
  categoryTitle,
  findTagBySlug,
  findTagsBySlug,
  getUniqueTags,
  getUniqueTagSlugs,
} from "@/lib/cedear-tags"
import { getCedearBases, getCedears } from "@/lib/get-cedears"
import { getSiteUrl, buildPageOpenGraph } from "@/lib/site"

export const revalidate = 60

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

  if (!tag) {
    return {
      title: "Categoría no encontrada",
      robots: { index: false, follow: false },
    }
  }

  const matchingTags = findTagsBySlug(tags, label)
  const count = countMatchingBases(bases, matchingTags)
  const title = categoryTitle(tag)
  const description = categoryDescription(tag, count)
  const canonical = categoryPath(tag)

  return {
    title,
    description,
    keywords: [
      `cedears ${tag}`,
      `cedears de ${tag.toLowerCase()}`,
      "cedears argentina",
      "listado cedears",
    ],
    alternates: { canonical },
    openGraph: buildPageOpenGraph({ title, description, url: canonical }),
  }
}

function CategoryJsonLd({
  tag,
  count,
}: {
  tag: string
  count: number
}) {
  const siteUrl = getSiteUrl()
  const pageUrl = `${siteUrl}${categoryPath(tag)}`
  const title = categoryTitle(tag)
  const description = categoryDescription(tag, count)

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: title,
        description,
        inLanguage: "es-AR",
        isPartOf: { "@id": `${siteUrl}/#website` },
      },
      {
        "@type": "ItemList",
        name: title,
        description,
        inLanguage: "es-AR",
        numberOfItems: count,
      },
    ],
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
  const bases = await getCedearBases()
  const tags = getUniqueTags(bases)
  const tag = findTagBySlug(tags, label)

  if (!tag) {
    notFound()
  }

  const matchingTags = findTagsBySlug(tags, label)
  const matchingTagSet = new Set(matchingTags)
  const title = categoryTitle(tag)
  const baseCount = countMatchingBases(bases, matchingTags)

  let content

  try {
    const cedears = await getCedears()
    const filtered = cedears.filter((c) =>
      c.tags.some((t) => matchingTagSet.has(t)),
    )
    content = <CedearsList cedears={filtered} />
  } catch {
    content = (
      <Alert variant="destructive">
        <AlertTitle>Error al cargar los datos</AlertTitle>
        <AlertDescription>
          No se pudo obtener la lista de CEDEARs. Intentá recargar la página en unos
          minutos.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <>
      <CategoryJsonLd tag={tag} count={baseCount} />
      <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-8 px-4 py-10 md:py-16">
        <header className="flex flex-col gap-4">
          <SiteNav currentPath="/" />
          <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li>
                <Link href="/" className="hover:text-foreground">
                  Listado
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li className="font-medium text-foreground">{title}</li>
            </ol>
          </nav>
          <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            {title}
          </h1>
          <p className="text-muted-foreground">
            Listado de CEDEARs etiquetados como {tag}, con precios, ratios y datos
            actualizados en Argentina.
          </p>
        </header>

        {content}

        <footer className="mt-auto border-t pt-6 text-sm text-muted-foreground">
          <Link href="/" className="font-medium text-foreground underline underline-offset-4">
            Volver al listado completo
          </Link>
          {" · "}
          Datos de{" "}
          <a
            href="https://data912.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground underline underline-offset-4"
          >
            data912
          </a>
          .
        </footer>
      </main>
    </>
  )
}
