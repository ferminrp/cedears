"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

import { SiteNav } from "@/components/site-nav"
import { SiteLoading } from "@/components/site-loading"
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

  return (
    <NavPendingProvider
      pendingHref={pendingHref}
      setPendingHref={setPendingHref}
    >
      <SiteNav />
      {pendingHref ? <SiteLoading /> : children}
    </NavPendingProvider>
  )
}
