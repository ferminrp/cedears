"use client"

import { useState } from "react"
import { ChevronDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type GuideTocItem = {
  id: string
  label: string
}

function TocLinks({ items }: { items: GuideTocItem[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.id}>
          <a
            href={`#${item.id}`}
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {item.label}
          </a>
        </li>
      ))}
    </ul>
  )
}

export function GuideToc({ items }: { items: GuideTocItem[] }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="lg:hidden">
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between"
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
            <TocLinks items={items} />
          </nav>
        ) : null}
      </div>

      <nav
        aria-label="Índice de la guía"
        className="hidden shrink-0 lg:block lg:w-[220px]"
      >
        <p className="mb-3 text-sm font-medium text-foreground">Índice</p>
        <div className="sticky top-[var(--space-xxl)]">
          <TocLinks items={items} />
        </div>
      </nav>
    </>
  )
}
