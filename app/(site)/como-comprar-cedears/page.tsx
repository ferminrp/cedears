import type { Metadata } from "next"
import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { BrokerCtaSlot } from "@/components/broker-cta-slot"
import { CedearFaqs } from "@/components/cedear-faqs"
import { GuideToc } from "@/components/guide-toc"
import { SiteFooter, footerLinkClassName } from "@/components/site-footer"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { absoluteCanonical } from "@/lib/canonical"
import {
  COMO_COMPRAR_FAQ,
  COMO_COMPRAR_INTRO,
  COMO_COMPRAR_KEYWORDS,
  COMO_COMPRAR_META_DESCRIPTION,
  COMO_COMPRAR_PAGE_H1,
  COMO_COMPRAR_PAGE_TITLE,
  COMO_COMPRAR_STEPS,
  COSTOS_SECTION,
  DIVIDENDOS_SECTION,
  GUIDE_CARD_CLASS,
  GUIDE_SECTION_HEADING_CLASS,
  GUIDE_TOC_ITEMS,
  QUE_ES_CEDEAR,
  RATIO_SECTION,
} from "@/lib/como-comprar-cedears"
import { buildPageOpenGraph, getSiteUrl } from "@/lib/site"
import { cn } from "@/lib/utils"

export const revalidate = 86400

export const metadata: Metadata = {
  title: COMO_COMPRAR_PAGE_TITLE,
  description: COMO_COMPRAR_META_DESCRIPTION,
  keywords: [...COMO_COMPRAR_KEYWORDS],
  alternates: {
    canonical: absoluteCanonical("/como-comprar-cedears"),
  },
  openGraph: buildPageOpenGraph({
    title: `${COMO_COMPRAR_PAGE_TITLE} | CEDEARs Argentina`,
    description: COMO_COMPRAR_META_DESCRIPTION,
    url: "/como-comprar-cedears",
  }),
}

function ComoComprarJsonLd() {
  const siteUrl = getSiteUrl()
  const pageUrl = `${siteUrl}/como-comprar-cedears`

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${pageUrl}#article`,
        headline: COMO_COMPRAR_PAGE_H1,
        description: COMO_COMPRAR_META_DESCRIPTION,
        inLanguage: "es-AR",
        url: pageUrl,
        author: {
          "@type": "Organization",
          name: "CEDEARs Argentina",
          url: siteUrl,
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: COMO_COMPRAR_FAQ.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
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

function GuideSection({
  id,
  title,
  children,
  className,
}: {
  id: string
  title: string
  children: ReactNode
  className?: string
}) {
  const headingId = `${id}-heading`

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn(GUIDE_CARD_CLASS, className)}
    >
      <h2 id={headingId} className={GUIDE_SECTION_HEADING_CLASS}>
        {title}
      </h2>
      <div className="mt-4 flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  )
}

function GuideParagraphs({ paragraphs }: { paragraphs: readonly string[] }) {
  return (
    <>
      {paragraphs.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </>
  )
}

export default function ComoComprarCedearsPage() {
  return (
    <>
      <ComoComprarJsonLd />
      <header className="flex flex-col gap-3">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-1.5 break-words">
            <li>
              <Link href="/" className="hover:text-foreground">
                Listado
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="font-medium text-foreground">{COMO_COMPRAR_PAGE_H1}</li>
          </ol>
        </nav>
        <h1 className="text-balance text-[length:var(--size-xl)] leading-[var(--line-xl)] font-semibold tracking-[var(--letter-spacing-xl)] md:text-[length:var(--size-xxl)] md:leading-[var(--line-xxl)]">
          {COMO_COMPRAR_PAGE_H1}
        </h1>
        <p className="text-pretty text-muted-foreground">{COMO_COMPRAR_INTRO}</p>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
        <GuideToc items={[...GUIDE_TOC_ITEMS]} />

        <div className="flex min-w-0 flex-col gap-6 lg:w-[680px] lg:max-w-[680px]">
          <GuideSection id="que-es-cedear" title="¿Qué es un CEDEAR?">
            <GuideParagraphs paragraphs={QUE_ES_CEDEAR} />
          </GuideSection>

          <GuideSection id="ratio-cedear" title={RATIO_SECTION.title}>
            <GuideParagraphs paragraphs={RATIO_SECTION.paragraphs} />
            <Alert className="mt-1 border border-border bg-[var(--success-transparent)] text-foreground shadow-none *:data-[slot=alert-description]:text-foreground">
              <AlertDescription>
                Consultá el ratio vigente y convertí CEDEARs ↔ acciones en la tabla
                interactiva.{" "}
                <Button
                  variant="link"
                  className="h-auto p-0 text-foreground"
                  nativeButton={false}
                  render={<Link href="/ratios" />}
                >
                  Ver ratios y calculadora
                  <ArrowRightIcon className="size-4" aria-hidden />
                </Button>
              </AlertDescription>
            </Alert>
          </GuideSection>

          <GuideSection
            id="pasos-comprar"
            title="Paso a paso: cuenta en una ALyC e inversión"
          >
            <ol className="flex flex-col gap-6">
              {COMO_COMPRAR_STEPS.map((step, index) => (
                <li key={step.name} className="flex gap-4">
                  <span
                    aria-hidden
                    className="w-8 shrink-0 font-mono text-[length:var(--size-xxl)] leading-none tabular-nums text-muted-foreground"
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-foreground">{step.name}</h3>
                    <p className="mt-2">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p>
              Para comparar comisiones publicadas entre ALyCs, podés consultar la{" "}
              <Link href="/alycs" className="text-foreground underline underline-offset-4">
                tabla de comisiones
              </Link>{" "}
              (solo referencia; verificá siempre el tarifario oficial).
            </p>
          </GuideSection>

          <GuideSection id="costos-impuestos" title={COSTOS_SECTION.title}>
            <GuideParagraphs paragraphs={COSTOS_SECTION.paragraphs} />
          </GuideSection>

          <GuideSection id="dividendos-cedears" title={DIVIDENDOS_SECTION.title}>
            <GuideParagraphs paragraphs={DIVIDENDOS_SECTION.paragraphs} />
            <Alert variant="callout" className="mt-1 shadow-none">
              <AlertDescription>
                Yield y fechas estimadas por ticker en el calendario del sitio.{" "}
                <Button
                  variant="link"
                  className="h-auto p-0 text-foreground"
                  nativeButton={false}
                  render={<Link href="/dividendos" />}
                >
                  Ver calendario de dividendos
                  <ArrowRightIcon className="size-4" aria-hidden />
                </Button>
              </AlertDescription>
            </Alert>
          </GuideSection>

          <BrokerCtaSlot />

          <section className={GUIDE_CARD_CLASS}>
            <CedearFaqs
              faqs={[...COMO_COMPRAR_FAQ]}
              embedded
              headingClassName={GUIDE_SECTION_HEADING_CLASS}
            />
          </section>
        </div>
      </div>

      <p className="mt-10 text-sm text-muted-foreground">
        Explorá el{" "}
        <Link href="/" className="underline underline-offset-4">
          listado de CEDEARs
        </Link>{" "}
        con precios y fichas por ticker.
      </p>

      <SiteFooter>
        <Link href="/" className={footerLinkClassName}>
          Volver al listado completo
        </Link>
        .
      </SiteFooter>
    </>
  )
}
