"use client"

import { Suspense, useEffect, useState } from "react"
import { usePathname } from "next/navigation"

import { NavigationProgress } from "@/components/navigation-progress"
import { SiteNav } from "@/components/site-nav"
import { NavPendingProvider } from "@/components/nav-pending"

export function SiteShell({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname() ?? "/"
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  useEffect(() => {
    if (!pendingHref) return

    const matches =
      pendingHref === "/"
        ? pathname === "/"
        : pathname === pendingHref || pathname.startsWith(`${pendingHref}/`)

    if (!matches) return

    setPendingHref(null)
  }, [pathname, pendingHref])

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant" in document.documentElement.style ? "instant" : "auto",
    })
  }, [pathname])

  return (
    <NavPendingProvider
      pendingHref={pendingHref}
      setPendingHref={setPendingHref}
    >
      <NavigationProgress />
      <SiteNav />
      <div aria-busy={pendingHref ? true : undefined}>
        {/* Keyed by route so React mounts fresh DOM instead of reusing the previous
            page's nodes (reused nodes pushed below the fold count as layout shift),
            and the fallback reserves a viewport of height while the new route streams. */}
        <Suspense
          key={pathname}
          fallback={<div aria-hidden className="min-h-svh" />}
        >
          {children}
        </Suspense>
      </div>
    </NavPendingProvider>
  )
}
