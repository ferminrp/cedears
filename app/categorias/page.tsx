import type { Metadata } from "next"
import Link from "next/link"
import { CategoryCompanyStack } from "@/components/category-company-stack"
import { SiteNav } from "@/components/site-nav"
import { SiteFooter, footerLinkClassName } from "@/components/site-footer"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  categoriesIndexDescription,
  categoriesIndexTitle,
  getCategoryIndex,
} from "@/lib/cedear-tags"
import { getCedearBases } from "@/lib/get-cedears"
import { buildPageOpenGraph } from "@/lib/site"

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  let categoryCount = 0

  try {
    const bases = await getCedearBases()
    categoryCount = getCategoryIndex(bases).length
  } catch {
    // Keep default metadata when the remote list is unavailable.
  }

  const title = categoriesIndexTitle()
  const description = categoriesIndexDescription(categoryCount)

  return {
    title,
    description,
    alternates: {
      canonical: "/categorias",
    },
    openGraph: buildPageOpenGraph({ title, description, url: "/categorias" }),
  }
}

export default async function CategoriasPage() {
  const title = categoriesIndexTitle()
  let content
  let categoryCount = 0

  try {
    const bases = await getCedearBases()
    const categories = getCategoryIndex(bases)
    categoryCount = categories.length

    content = (
      <ul className="divide-y border-t border-border/60">
        {categories.map(({ tag, href, count, previewTickers }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex items-center justify-between gap-4 py-3 transition-colors hover:text-foreground"
            >
              <span className="font-medium">{tag}</span>
              <CategoryCompanyStack
                previewTickers={previewTickers}
                totalCount={count}
              />
            </Link>
          </li>
        ))}
      </ul>
    )
  } catch {
    content = (
      <Alert variant="destructive">
        <AlertTitle>Error al cargar los datos</AlertTitle>
        <AlertDescription>
          No se pudo obtener el listado de categorías. Intentá recargar la página en
          unos minutos.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-8 px-4 py-10 md:py-16">
      <header className="flex flex-col gap-4">
        <SiteNav currentPath="/categorias" />
        <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
          {title}
        </h1>
        {categoryCount > 0 ? (
          <p className="text-muted-foreground">
            Hay {categoryCount} categorías para explorar empresas con CEDEAR en
            Argentina.
          </p>
        ) : null}
      </header>

      {content}

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
    </main>
  )
}
