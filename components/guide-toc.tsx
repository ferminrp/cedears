"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import type { MouseEvent } from "react"
import { ChevronDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type GuideTocItem = {
  id: string
  label: string
}

const GUIDE_SECTION_SCROLL_MARGIN_PX = 20
const SCROLL_LOCK_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  " ",
])

function isModifiedLinkClick(event: MouseEvent<HTMLAnchorElement>) {
  return (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
}

function applySectionScrollMargins(sectionIds: readonly string[]) {
  const margin = `${GUIDE_SECTION_SCROLL_MARGIN_PX}px`
  for (const id of sectionIds) {
    const el = document.getElementById(id)
    if (el) {
      el.style.scrollMarginTop = margin
    }
  }
}

function clearSectionScrollMargins(sectionEls: HTMLElement[]) {
  for (const section of sectionEls) {
    section.style.scrollMarginTop = ""
  }
}

function pickActiveSectionId(
  sectionEls: HTMLElement[],
  viewportTopInset: number,
) {
  if (sectionEls.length === 0) return null

  const viewportTop = viewportTopInset
  const viewportBottom = window.innerHeight

  let bestId: string | null = null
  let bestVisible = 0
  let bestTop = Number.POSITIVE_INFINITY

  for (const section of sectionEls) {
    const { top, bottom } = section.getBoundingClientRect()
    const visible = Math.min(bottom, viewportBottom) - Math.max(top, viewportTop)
    if (visible <= 0) continue

    if (visible > bestVisible || (visible === bestVisible && top < bestTop)) {
      bestVisible = visible
      bestTop = top
      bestId = section.id
    }
  }

  if (bestId) return bestId

  let fallback = sectionEls[0].id
  const line = window.scrollY + viewportTopInset + 1
  for (const section of sectionEls) {
    const top = section.getBoundingClientRect().top + window.scrollY
    if (top <= line) fallback = section.id
    else break
  }

  return fallback
}

function TocLinks({
  items,
  activeId,
  onTocLinkClick,
}: {
  items: GuideTocItem[]
  activeId: string | null
  onTocLinkClick?: (id: string, event: MouseEvent<HTMLAnchorElement>) => void
}) {
  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => {
        const isActive = activeId === item.id
        return (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={isActive ? "location" : undefined}
              onClick={(event) => {
                if (isModifiedLinkClick(event)) return
                onTocLinkClick?.(item.id, event)
              }}
              className={cn(
                "inline-flex min-h-11 w-full items-center rounded-[var(--radius-s)] px-2 text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline",
                isActive && "bg-muted font-medium text-foreground no-underline",
              )}
            >
              {item.label}
            </a>
          </li>
        )
      })}
    </ul>
  )
}

export function GuideToc({ items }: { items: GuideTocItem[] }) {
  const [open, setOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null)
  const sectionElsRef = useRef<HTMLElement[]>([])
  const lockedIdRef = useRef<string | null>(null)
  const userUnlockedRef = useRef(false)
  const itemIdsRef = useRef<readonly string[]>([])

  const itemIdsKey = useMemo(
    () => items.map((item) => item.id).join("|"),
    [items],
  )

  itemIdsRef.current = itemIdsKey ? itemIdsKey.split("|") : []

  const lockActiveId = useCallback((id: string) => {
    userUnlockedRef.current = false
    lockedIdRef.current = id
    setActiveId(id)
  }, [])

  const releaseActiveLock = useCallback(() => {
    lockedIdRef.current = null
  }, [])

  const refreshActiveFromScroll = useCallback(() => {
    const sections = sectionElsRef.current
    if (sections.length === 0) return

    if (lockedIdRef.current) {
      setActiveId(lockedIdRef.current)
      return
    }

    const next = pickActiveSectionId(sections, GUIDE_SECTION_SCROLL_MARGIN_PX)
    if (next) {
      setActiveId(next)
    }
  }, [])

  const syncActiveFromHash = useCallback(() => {
    const hash = window.location.hash.slice(1)

    if (!hash) {
      userUnlockedRef.current = false
      releaseActiveLock()
      refreshActiveFromScroll()
      return
    }

    if (userUnlockedRef.current) {
      refreshActiveFromScroll()
      return
    }

    if (itemIdsRef.current.includes(hash)) {
      lockActiveId(hash)
      return
    }

    refreshActiveFromScroll()
  }, [lockActiveId, refreshActiveFromScroll, releaseActiveLock])

  const syncActiveFromHashRef = useRef(syncActiveFromHash)
  syncActiveFromHashRef.current = syncActiveFromHash

  const refreshActiveFromScrollRef = useRef(refreshActiveFromScroll)
  refreshActiveFromScrollRef.current = refreshActiveFromScroll

  const releaseActiveLockRef = useRef(releaseActiveLock)
  releaseActiveLockRef.current = releaseActiveLock

  useEffect(() => {
    const ids = itemIdsKey ? itemIdsKey.split("|") : []
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => node !== null)

    sectionElsRef.current = sections
    if (sections.length === 0) return

    applySectionScrollMargins(ids)
    syncActiveFromHashRef.current()

    let frame = 0
    const scheduleRefresh = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        refreshActiveFromScrollRef.current()
      })
    }

    const onUserScrollIntent = () => {
      if (!lockedIdRef.current) return
      userUnlockedRef.current = true
      releaseActiveLockRef.current()
      scheduleRefresh()
    }

    const onScroll = () => {
      scheduleRefresh()
    }

    const onHistoryChange = () => {
      syncActiveFromHashRef.current()
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (!SCROLL_LOCK_KEYS.has(event.key)) return
      onUserScrollIntent()
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", scheduleRefresh)
    window.addEventListener("hashchange", onHistoryChange)
    window.addEventListener("popstate", onHistoryChange)
    window.addEventListener("wheel", onUserScrollIntent, { passive: true })
    window.addEventListener("touchmove", onUserScrollIntent, { passive: true })
    window.addEventListener("keydown", onKeyDown)

    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", scheduleRefresh)
      window.removeEventListener("hashchange", onHistoryChange)
      window.removeEventListener("popstate", onHistoryChange)
      window.removeEventListener("wheel", onUserScrollIntent)
      window.removeEventListener("touchmove", onUserScrollIntent)
      window.removeEventListener("keydown", onKeyDown)
      if (frame) window.cancelAnimationFrame(frame)
      clearSectionScrollMargins(sections)
    }
  }, [itemIdsKey])

  const handleTocLinkClick = useCallback(
    (id: string, _event: MouseEvent<HTMLAnchorElement>) => {
      lockActiveId(id)
      requestAnimationFrame(() => {
        setOpen(false)
      })
    },
    [lockActiveId],
  )

  return (
    <>
      <div className="lg:hidden">
        <Button
          type="button"
          variant="outline"
          className="min-h-11 w-full justify-between"
          aria-expanded={open}
          aria-controls="guide-toc-panel-mobile"
          onClick={() => setOpen((value) => !value)}
        >
          Índice de la guía
          <ChevronDownIcon
            className={cn("size-4 transition-transform", open && "rotate-180")}
            aria-hidden
          />
        </Button>
        {open ? (
          <nav
            id="guide-toc-panel-mobile"
            aria-label="Índice de la guía"
            className="mt-3 rounded-[var(--radius-xl)] border border-border bg-card p-4 shadow-[var(--shadow-s)]"
          >
            <TocLinks
              items={items}
              activeId={activeId}
              onTocLinkClick={handleTocLinkClick}
            />
          </nav>
        ) : null}
      </div>

      <nav
        aria-label="Índice de la guía"
        className="hidden shrink-0 lg:sticky lg:top-[var(--space-xxl)] lg:block lg:w-[220px] lg:self-start"
      >
        <p className="mb-3 text-sm font-medium text-foreground">Índice</p>
        <TocLinks
          items={items}
          activeId={activeId}
          onTocLinkClick={handleTocLinkClick}
        />
      </nav>
    </>
  )
}
