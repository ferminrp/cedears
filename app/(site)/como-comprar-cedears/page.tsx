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
  GUIDE_BODY_CLASS,
  GUIDE_CARD_CLASS,
  GUIDE_DATE_MODIFIED_ISO,
  GUIDE_RESUMEN_ROWS,
  GUIDE_SECTION_HEADING_CLASS,
  GUIDE_STEP_NUMBER_CLASS,
  GUIDE_TOC_ITEMS,
  QUE_ES_CEDEAR,
  RATIO_SECTION,
  formatGuideUpdatedDate,
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
        dateModified: GUIDE_DATE_MODIFIED_ISO,
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

const GUIDE_CALLOUT_BUTTON_CLASS =
  "mt-3 min-h-11 border-[var(--success)] bg-[var(--success-transparent)] text-foreground hover:bg-[var(--success-transparent)]/80"

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
      <div className={cn("mt-4 flex flex-col gap-3", GUIDE_BODY_CLASS)}>{children}</div>
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
  const updatedLabel = formatGuideUpdatedDate(GUIDE_DATE_MODIFIED_ISO)

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
        <p className="max-w-[65ch] text-pretty text-base leading-relaxed text-foreground">
          {COMO_COMPRAR_INTRO}
        </p>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
        <GuideToc items={[...GUIDE_TOC_ITEMS]} />

        <div className="flex min-w-0 flex-col gap-6 lg:w-[680px] lg:max-w-[680px]">
          <GuideSection id="resumen" title="Resumen">
            <dl className="flex flex-col gap-3">
              {GUIDE_RESUMEN_ROWS.map((row) => (
                <div
                  key={row.label}
                  className="flex flex-col gap-0.5 border-b border-border pb-3 last:border-0 last:pb-0 sm:flex-row sm:justify-between sm:gap-4"
                >
                  <dt className="text-muted-foreground">{row.label}</dt>
                  <dd className="font-medium text-foreground sm:text-right">{row.value}</dd>
                </div>
              ))}
            </dl>
            <p className="text-sm text-muted-foreground">
              Actualizado el{" "}
              <time dateTime={GUIDE_DATE_MODIFIED_ISO}>{updatedLabel}</time>.
            </p>
          </GuideSection>

          <GuideSection id="que-es-cedear" title="¿Qué es un CEDEAR?">
            <GuideParagraphs paragraphs={QUE_ES_CEDEAR} />
          </GuideSection>

          <GuideSection id="ratio-cedear" title={RATIO_SECTION.title}>
            <GuideParagraphs paragraphs={RATIO_SECTION.paragraphs} />
            <Alert className="mt-1 max-w-none border border-border bg-[var(--success-transparent)] text-foreground shadow-none *:data-[slot=alert-description]:text-foreground">
              <AlertDescription>
                Consultá el ratio vigente y convertí CEDEARs ↔ acciones en la tabla
                interactiva.
                <Button
                  variant="secondary"
                  className={GUIDE_CALLOUT_BUTTON_CLASS}
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
            <ol className="flex max-w-none flex-col gap-6">
              {COMO_COMPRAR_STEPS.map((step, index) => (
                <li key={step.name} className="flex gap-4">
                  <span aria-hidden className={GUIDE_STEP_NUMBER_CLASS}>
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-medium text-foreground">{step.name}</h3>
                    <p className="mt-2">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p>
              Para comparar comisiones publicadas entre ALyCs, podés consultar la{" "}
              <Link href="/alycs" className="underline underline-offset-4">
                tabla de comisiones
              </Link>{" "}
              (solo referencia; verificá siempre el tarifario oficial).
            </p>
          </GuideSection>

          <BrokerCtaSlot />

          <GuideSection id="costos-impuestos" title={COSTOS_SECTION.title}>
            <GuideParagraphs paragraphs={COSTOS_SECTION.paragraphs} />
          </GuideSection>

          <GuideSection id="dividendos-cedears" title={DIVIDENDOS_SECTION.title}>
            <GuideParagraphs paragraphs={DIVIDENDOS_SECTION.paragraphs} />
            <Alert variant="callout" className="mt-1 max-w-none shadow-none">
              <AlertDescription>
                Yield y fechas estimadas por ticker en el calendario del sitio.
                <Button
                  variant="secondary"
                  className="mt-3 min-h-11"
                  nativeButton={false}
                  render={<Link href="/dividendos" />}
                >
                  Ver calendario de dividendos
                  <ArrowRightIcon className="size-4" aria-hidden />
                </Button>
              </AlertDescription>
            </Alert>
          </GuideSection>

          <section className={GUIDE_CARD_CLASS}>
            <CedearFaqs
              faqs={[...COMO_COMPRAR_FAQ]}
              embedded
              sectionId="preguntas-frecuentes"
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
