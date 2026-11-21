"use client"

import { useEffect } from "react"
import Link from "next/link"
import { PlusIcon } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { pushRecentCedear } from "@/lib/recent-cedears"

/**
 * Mobile-only (< md) bar fixed to the bottom of the viewport on /cedear/[ticker].
 * Sits above the app's bottom tab bar via `--bottom-nav-height` (defined elsewhere).
 * Also records the ticker in the "vistos hace poco" list used by the home search.
 */
export function CedearDetailActionBar({ ticker }: { ticker: string }) {
  useEffect(() => {
    pushRecentCedear(ticker)
  }, [ticker])

  return (
    <>
      <div aria-hidden className="cd-action-spacer md:hidden" />
      <div data-detail-action-bar className="cd-action-bar md:hidden">
        <Link
          href={`/portfolio?agregar=${encodeURIComponent(ticker)}`}
          className={buttonVariants({
            size: "lg",
            className: "min-h-11 w-full font-semibold",
          })}
        >
          <PlusIcon data-icon="inline-start" aria-hidden />
          Agregar al portfolio
        </Link>
      </div>
    </>
  )
}
