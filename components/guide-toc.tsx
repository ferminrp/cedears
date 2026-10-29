"use client"

import { useEffect, useState } from "react"
import { ChevronDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type GuideTocItem = {
  id: string
  label: string
}

function TocLinks({
  items,
  activeId,
  onNavigate,
}: {
  items: GuideTocItem[]
  activeId: string | null
  onNavigate?: () => void
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
              onClick={onNavigate}
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

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((node): node is HTMLElement => node !== null)

    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const intersecting = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

        if (intersecting[0]?.target.id) {
          setActiveId(intersecting[0].target.id)
        }
      },
      {
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      },
    )

    for (const section of sections) {
      observer.observe(section)
    }

    return () => observer.disconnect()
  }, [items])

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
              onNavigate={() => setOpen(false)}
            />
          </nav>
        ) : null}
      </div>

      <nav
        aria-label="Índice de la guía"
        className="hidden shrink-0 lg:sticky lg:top-[var(--space-xxl)] lg:block lg:w-[220px] lg:self-start"
      >
        <p className="mb-3 text-sm font-medium text-foreground">Índice</p>
        <TocLinks items={items} activeId={activeId} />
      </nav>
    </>
  )
}
