"use client"

import { useMemo, useState } from "react"
import { SearchIcon } from "lucide-react"

import { type Cedear } from "@/lib/cedears"
import { logoUrl } from "@/lib/logo"
import { Input } from "@/components/ui/input"

export function CedearPicker({
  cedears,
  selected,
  onAdd,
  placeholder = "Agregar CEDEAR por ticker o nombre...",
}: {
  cedears: Cedear[]
  selected: Set<string>
  onAdd: (ticker: string) => void
  placeholder?: string
}) {
  const [query, setQuery] = useState("")
  const [focused, setFocused] = useState(false)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q === "") return []
    return cedears
      .filter(
        (c) =>
          !selected.has(c.Cedears) &&
          (c.Cedears.toLowerCase().includes(q) ||
            c.Name.toLowerCase().includes(q)),
      )
      .slice(0, 8)
  }, [cedears, query, selected])

  function handleAdd(ticker: string) {
    onAdd(ticker)
    setQuery("")
  }

  const showResults = focused && results.length > 0

  return (
    <div className="relative w-full sm:max-w-md">
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        className="pl-9"
        aria-label="Buscar CEDEAR para agregar"
      />

      {showResults && (
        <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md">
          {results.map((cedear) => (
            <li key={cedear.Cedears}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleAdd(cedear.Cedears)}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted"
              >
                <img
                  src={logoUrl(cedear.TickerOriginal) || "/placeholder.svg"}
                  alt=""
                  width={16}
                  height={16}
                  className="size-4 shrink-0 rounded-sm bg-muted object-contain"
                  loading="lazy"
                />
                <span className="font-mono font-medium">{cedear.Cedears}</span>
                <span className="truncate text-muted-foreground">
                  {cedear.Name}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
