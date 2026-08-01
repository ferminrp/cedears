"use client"

import { useState } from "react"
import { alycFaviconUrl } from "@/lib/alycs"
import { cn } from "@/lib/utils"

function alycInitial(name: string): string {
  const normalized = name.trim()
  return normalized.charAt(0).toUpperCase() || "?"
}

export function AlycLogo({
  name,
  domain,
  className,
}: {
  name: string
  domain: string
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
        {alycInitial(name)}
      </span>
    )
  }

  return (
    <img
      src={alycFaviconUrl(domain)}
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
