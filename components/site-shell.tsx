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
        <Suspense fallback={null}>{children}</Suspense>
      </div>
    </NavPendingProvider>
  )
}
