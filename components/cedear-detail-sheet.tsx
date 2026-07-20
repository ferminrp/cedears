"use client"

import type { Cedear } from "@/lib/cedears"
import { useMediaQuery } from "@/hooks/use-media-query"
import { CedearDetailView } from "@/components/cedear-detail-view"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
            ? "w-full sm:max-w-md"
            : "max-h-[85vh] overflow-y-auto rounded-t-xl"
        }
      >
        {cedear ? (
          <>
            <SheetHeader className="border-b">
              <SheetTitle className="font-mono text-lg tracking-tight">
                {cedear.Cedears}
              </SheetTitle>
              <SheetDescription>{cedear.Name}</SheetDescription>
            </SheetHeader>

            <div className="px-4 pb-6">
              <CedearDetailView cedear={cedear} />
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
