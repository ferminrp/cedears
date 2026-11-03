"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"

import { useNavPending } from "@/components/nav-pending"
import { cn } from "@/lib/utils"

const SHOW_DELAY_MS = 150
const NAV_IDLE_POLL_MS = 100
// vinext reports the navigation idle ~100-150 ms before React commits the new
// page, so idle alone would drop the bar while the old page is still on screen.
// A commit dismisses the bar through the pathname effect; this grace only
// catches navigations that never commit (file downloads, aborted fetches).
const NAV_IDLE_GRACE_MS = 600

const vinextClientNavStateKey = Symbol.for("vinext.clientNavigationState")

type VinextClientNavState = {
  navigationSnapshotActiveCount: number
  pendingPathname: string | null
}

function isClientNavigationInProgress() {
  if (typeof window === "undefined") return false
  const state = (window as unknown as { [k: symbol]: VinextClientNavState | undefined })[vinextClientNavStateKey]
  if (!state) return false
  return state.navigationSnapshotActiveCount > 0 || state.pendingPathname !== null
}

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

  // The delay is measured from the click itself, not from a React commit:
  // any same-origin <a> (nav, category cards, ticker rows) starts the timer.
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!isAnchorNav(event)) return
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null
        setVisible(true)
      }, SHOW_DELAY_MS)
    }
    document.addEventListener("click", onClick, true)
    return () => document.removeEventListener("click", onClick, true)
  }, [])

  useEffect(() => {
    if (pendingHref || timerRef.current !== null) return
    setVisible(false)
  }, [pendingHref])

  useEffect(() => {
    if (!visible) return
    let idleSince: number | null = null
    const sync = () => {
      if (isClientNavigationInProgress()) {
        idleSince = null
        return
      }
      idleSince ??= performance.now()
      if (performance.now() - idleSince >= NAV_IDLE_GRACE_MS) setVisible(false)
    }
    sync()
    const id = window.setInterval(sync, NAV_IDLE_POLL_MS)
    return () => window.clearInterval(id)
  }, [visible])

  useEffect(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    timerRef.current = null
    setVisible(false)
  }, [pathname])

  if (!visible) return null

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

function isAnchorNav(event: MouseEvent) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false
  const anchor = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null
  if (!anchor || anchor.hasAttribute("download")) return false
  if (anchor.target && anchor.target !== "_self") return false
  const url = new URL(anchor.href, window.location.href)
  if (url.origin !== window.location.origin) return false
  return url.pathname !== window.location.pathname
}
