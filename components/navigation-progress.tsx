"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

import { useNavPending } from "@/components/nav-pending"
import { cn } from "@/lib/utils"

const SHOW_DELAY_MS = 150

export function NavigationProgress() {
  const pathname = usePathname() ?? "/"
  const { pendingHref } = useNavPending()
  const [visible, setVisible] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReducedMotion(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  useEffect(() => {
    if (!pendingHref) {
      setVisible(false)
      return
    }

    const timer = window.setTimeout(() => setVisible(true), SHOW_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [pendingHref])

  useEffect(() => {
    setVisible(false)
  }, [pathname])

  if (!pendingHref || !visible) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden bg-foreground/10"
      role="progressbar"
      aria-label="Cargando sección"
      aria-busy="true"
    >
      <div
        className={cn(
          "h-full bg-foreground/80",
          reducedMotion ? "w-full opacity-70" : "w-1/3 motion-safe:animate-[nav-progress_1s_ease-in-out_infinite]",
        )}
      />
    </div>
  )
}
