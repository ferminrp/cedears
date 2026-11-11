"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type GuideTocItem = {
  id: string
  label: string
}

const GUIDE_SCROLL_GAP_PX = 12
const MOBILE_MEDIA = "(max-width: 1023px)"

function isMobileGuideLayout() {
  return typeof window !== "undefined" && window.matchMedia(MOBILE_MEDIA).matches
}

function measureGuideScrollOffset(): number {
  let offset = GUIDE_SCROLL_GAP_PX

  if (isMobileGuideLayout()) {
    const chromeAnchors = [
      document.querySelector<HTMLElement>("[aria-controls='guide-toc-panel-mobile']"),
      document.querySelector<HTMLElement>(".md\\:hidden button"),
    ]

    for (const el of chromeAnchors) {
      if (!el) continue
      const { bottom } = el.getBoundingClientRect()
      if (bottom > 0) {
        offset = Math.max(offset, bottom + GUIDE_SCROLL_GAP_PX)
      }
    }
  } else {
    offset = 32
  }

  return Math.round(offset)
}

function syncSectionScrollMargins(sectionIds: string[]) {
  const offset = measureGuideScrollOffset()
  const margin = `${offset}px`
  document.documentElement.style.scrollPaddingTop = margin

  for (const id of sectionIds) {
    const el = document.getElementById(id)
    if (el) {
      el.style.scrollMarginTop = margin
    }
  }

  return offset
}

function pickActiveSectionId(sectionEls: HTMLElement[], scrollOffset: number) {
  if (sectionEls.length === 0) return null

  const viewportTop = scrollOffset
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
  const line = window.scrollY + scrollOffset + 1
  for (const section of sectionEls) {
    const top = section.getBoundingClientRect().top + window.scrollY
    if (top <= line) fallback = section.id
    else break
  }

  return fallback
}

function scrollToGuideSection(id: string) {
  const el = document.getElementById(id)
  if (!el) return

  const offset = measureGuideScrollOffset()
  const top = el.getBoundingClientRect().top + window.scrollY - offset

  window.scrollTo({
    top: Math.max(0, top),
    behavior: "instant" in document.documentElement.style ? "instant" : "auto",
  })

  history.replaceState(null, "", `#${id}`)
}

function TocLinks({
  items,
  activeId,
  onItemActivate,
}: {
  items: GuideTocItem[]
  activeId: string | null
  onItemActivate: (id: string) => void
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
                event.preventDefault()
                onItemActivate(item.id)
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
  const pendingScrollIdRef = useRef<string | null>(null)

  const itemIds = items.map((item) => item.id)

  const refreshActiveFromScroll = useCallback(() => {
    const sections = sectionElsRef.current
    if (sections.length === 0) return

    const offset = syncSectionScrollMargins(itemIds)
    const next = pickActiveSectionId(sections, offset)
    if (next) {
      setActiveId(next)
    }
  }, [itemIds])

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((node): node is HTMLElement => node !== null)

    sectionElsRef.current = sections
    if (sections.length === 0) return

    refreshActiveFromScroll()

    let frame = 0
    const onScrollOrResize = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        refreshActiveFromScroll()
      })
    }

    window.addEventListener("scroll", onScrollOrResize, { passive: true })
    window.addEventListener("resize", onScrollOrResize)

    return () => {
      window.removeEventListener("scroll", onScrollOrResize)
      window.removeEventListener("resize", onScrollOrResize)
      if (frame) window.cancelAnimationFrame(frame)
      document.documentElement.style.scrollPaddingTop = ""
      for (const section of sections) {
        section.style.scrollMarginTop = ""
      }
    }
  }, [items, refreshActiveFromScroll])

  useEffect(() => {
    if (open) return

    const id = pendingScrollIdRef.current
    if (id) {
      pendingScrollIdRef.current = null
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToGuideSection(id)
          setActiveId(id)
          refreshActiveFromScroll()
        })
      })
      return
    }

    refreshActiveFromScroll()
  }, [open, refreshActiveFromScroll])

  const activateSection = useCallback(
    (id: string, { mobile }: { mobile: boolean }) => {
      setActiveId(id)

      if (mobile && open) {
        pendingScrollIdRef.current = id
        setActiveId(id)
        setOpen(false)
        return
      }

      scrollToGuideSection(id)
      setActiveId(id)
      requestAnimationFrame(refreshActiveFromScroll)
    },
    [open, refreshActiveFromScroll],
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
              onItemActivate={(id) => activateSection(id, { mobile: true })}
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
          onItemActivate={(id) => activateSection(id, { mobile: false })}
        />
      </nav>
    </>
  )
}
