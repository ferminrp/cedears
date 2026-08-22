"use client"

import { Suspense, useEffect, useState } from "react"
import { usePathname } from "next/navigation"

import { SiteNav } from "@/components/site-nav"
import { SiteLoading } from "@/components/site-loading"
import { NavPendingProvider } from "@/components/nav-pending"
import { pendingMatchesPath } from "@/lib/nav-pending-href"

export function SiteShell({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname() ?? "/"
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  useEffect(() => {
    if (!pendingHref) return
    if (!pendingMatchesPath({ pendingHref, pathname })) return

    // Path committed; hand off to Suspense for any remaining RSC stream.
    setPendingHref(null)
  }, [pathname, pendingHref])

  return (
    <NavPendingProvider
      pendingHref={pendingHref}
      setPendingHref={setPendingHref}
    >
      <SiteNav />
      {pendingHref ? (
        <SiteLoading />
      ) : (
        <Suspense fallback={<SiteLoading />}>{children}</Suspense>
      )}
    </NavPendingProvider>
  )
}
