"use client"

import { useState } from "react"
import { logoUrl } from "@/lib/logo"
import { cn } from "@/lib/utils"

function tickerInitial(ticker: string): string {
  const normalized = ticker.trim().toUpperCase()
  return normalized.charAt(0) || "?"
}

export function TickerLogo({
  ticker,
  className,
}: {
  ticker: string
  className?: string
}) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <span
        aria-hidden
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-medium text-muted-foreground",
          className,
        )}
      >
        {tickerInitial(ticker)}
      </span>
    )
  }

  return (
    <img
      src={logoUrl(ticker)}
      alt=""
      width={32}
      height={32}
      className={cn(
        "size-8 shrink-0 rounded-md bg-muted object-contain",
        className,
      )}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}
