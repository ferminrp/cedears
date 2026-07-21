"use client"

import type { Cedear } from "@/lib/cedears"
import { useMediaQuery } from "@/hooks/use-media-query"
import { CedearCompanyProfileLoader } from "@/components/cedear-company-profile"
import { CedearDetailView } from "@/components/cedear-detail-view"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { logoUrl } from "@/lib/logo"
import Link from "next/link"

export function CedearDetailSheet({
  cedear,
  open,
  onOpenChange,
}: {
  cedear: Cedear | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={
          isDesktop
            ? "w-full gap-0 overflow-hidden sm:max-w-md"
            : "max-h-[85vh] gap-0 overflow-hidden rounded-t-xl"
        }
      >
        {cedear ? (
          <>
            <SheetHeader className="shrink-0 border-b pr-10">
              <div className="flex items-start gap-3">
                <img
                  src={logoUrl(cedear.TickerOriginal)}
                  alt=""
                  width={40}
                  height={40}
                  className="size-10 shrink-0 rounded-md bg-muted object-contain"
                />
                <div className="min-w-0">
                  <SheetTitle className="font-mono text-lg tracking-tight">
                    {cedear.Cedears}
                  </SheetTitle>
                  <SheetDescription>{cedear.Name}</SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              <CedearDetailView cedear={cedear} />
              <div className="mt-6 border-t border-border/60 pt-6">
                <CedearCompanyProfileLoader
                  tickerOriginal={cedear.TickerOriginal}
                  compact
                />
              </div>
              <Link
                href={`/cedear/${cedear.Cedears}`}
                className="mt-6 inline-flex text-sm font-medium text-foreground underline underline-offset-4"
              >
                Ver página completa →
              </Link>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
