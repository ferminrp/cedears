import type { Metadata } from "next"
import { absoluteCanonical } from "@/lib/canonical"
import {
  DIVIDENDOS_META_DESCRIPTION,
  DIVIDENDOS_PAGE_TITLE,
} from "@/lib/dividends"
import { buildPageOpenGraph } from "@/lib/site"
import { DividendosContent } from "./dividendos-content"

export const revalidate = 86400

// No searchParams here: reading them makes the route dynamic (cf-cache-status BYPASS).
// Middleware rewrites ?frecuencia=<valid> to /dividendos/f/<valor> (ISR per filter),
// so deep links paint already filtered.
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: DIVIDENDOS_PAGE_TITLE,
    description: DIVIDENDOS_META_DESCRIPTION,
    keywords: [
      "dividendos cedears",
      "cedears que pagan dividendos",
      "calendario dividendos cedears",
    ],
    alternates: {
      canonical: absoluteCanonical("/dividendos"),
    },
    openGraph: buildPageOpenGraph({
      title: DIVIDENDOS_PAGE_TITLE,
      description: DIVIDENDOS_META_DESCRIPTION,
      url: "/dividendos",
    }),
  }
}


export default function DividendosPage() {
  return <DividendosContent />
}
