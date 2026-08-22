"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ComponentProps } from "react"

import { useNavPending } from "@/components/nav-pending"
import { pathFromHref } from "@/lib/nav-pending-href"

export function SiteLink({
  href,
  onNavigate,
  ...props
}: ComponentProps<typeof Link>) {
  const pathname = usePathname() ?? "/"
  const { setPendingHref } = useNavPending()

  return (
    <Link
      href={href}
      onNavigate={(event) => {
        const path = pathFromHref(href)
        if (path !== pathname) {
          setPendingHref(path)
        }
        onNavigate?.(event)
      }}
      {...props}
    />
  )
}
