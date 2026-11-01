import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { absoluteCanonical } from "@/lib/canonical"
import { DIVIDENDOS_META_DESCRIPTION, DIVIDENDOS_PAGE_TITLE } from "@/lib/dividends"
import {
  DIVIDEND_FREQUENCY_FILTERS,
  parseDividendFrequencyFilter,
} from "@/lib/dividends-shared"
import { DividendosContent } from "../../dividendos-content"

// Internal target of the middleware rewrite for /dividendos?frecuencia=<valor>.
// One ISR entry per filter so deep links paint already filtered (no "Todas" flash).
export const revalidate = 86400

export function generateStaticParams() {
  return DIVIDEND_FREQUENCY_FILTERS.map((frecuencia) => ({ frecuencia }))
}

type Props = { params: Promise<{ frecuencia: string }> }

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: DIVIDENDOS_PAGE_TITLE,
    description: DIVIDENDOS_META_DESCRIPTION,
    alternates: { canonical: absoluteCanonical("/dividendos") },
    robots: { index: false, follow: true },
  }
}

export default async function DividendosFilteredPage({ params }: Props) {
  const frequency = parseDividendFrequencyFilter((await params).frecuencia)
  if (!frequency) notFound()
  return <DividendosContent frequency={frequency} />
}
