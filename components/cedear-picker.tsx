"use client"

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react"
import { LandmarkIcon, SearchIcon } from "lucide-react"

import { type Bond } from "@/lib/bonds"
import { type Cedear } from "@/lib/cedears"
import { logoUrl } from "@/lib/logo"
import { rankPickerResults } from "@/lib/picker-search"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

type PickerOption = {
  ticker: string
  name: string
  logoTicker: string | null
  badge: string | null
}

export function CedearPicker({
  cedears,
  bonds = [],
  selected,
  onAdd,
  placeholder = bonds.length > 0
    ? "Agregar CEDEAR o bono por ticker o nombre..."
    : "Agregar CEDEAR por ticker o nombre...",
}: {
  cedears: Cedear[]
  bonds?: Bond[]
  selected: Set<string>
  onAdd: (ticker: string) => void
  placeholder?: string
}) {
  const [query, setQuery] = useState("")
  const [focused, setFocused] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const listRef = useRef<HTMLUListElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()

  const options = useMemo<PickerOption[]>(
    () => [
      ...cedears.map((c) => ({
        ticker: c.Cedears,
        name: c.Name,
        logoTicker: c.TickerOriginal,
        badge: null,
      })),
      ...bonds.map((b) => ({
        ticker: b.symbol,
        name: b.name,
        logoTicker: null,
        badge: b.kind === "letra" ? "Letra" : "Bono",
      })),
    ],
    [cedears, bonds],
  )

  const results = useMemo(
    () => rankPickerResults(options, query, selected),
    [options, query, selected],
  )

  const safeIndex =
    results.length === 0 ? 0 : Math.min(activeIndex, results.length - 1)

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${safeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" })
  }, [safeIndex])

  function handleAdd(ticker: string) {
    onAdd(ticker)
    setQuery("")
    setFocused(true)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const showResults = focused && results.length > 0
  const optionId = (index: number) => `${listId}-option-${index}`

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault()
      setFocused(false)
      return
    }
    if (results.length === 0) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setFocused(true)
      setActiveIndex((i) => (i + 1) % results.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setFocused(true)
      setActiveIndex((i) => (i - 1 + results.length) % results.length)
    } else if (e.key === "Enter" && showResults) {
      e.preventDefault()
      const option = results[safeIndex]
      if (option) handleAdd(option.ticker)
    }
  }

  const searchLabel =
    bonds.length > 0
      ? "Buscar CEDEAR o bono para agregar"
      : "Buscar CEDEAR para agregar"

  return (
    <div className="relative w-full sm:max-w-md">
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-expanded={showResults}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showResults ? optionId(safeIndex) : undefined}
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setFocused(true)
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        className="pl-9"
        aria-label={searchLabel}
      />

      {showResults && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label="Resultados de búsqueda"
          className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md"
        >
          {results.map((option, index) => (
            <li
              key={option.ticker}
              id={optionId(index)}
              role="option"
              aria-selected={index === safeIndex}
              data-index={index}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => handleAdd(option.ticker)}
              className={cn(
                "flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors",
                index === safeIndex && "bg-muted",
              )}
            >
              {option.logoTicker ? (
                <img
                  src={logoUrl(option.logoTicker) || "/placeholder.svg"}
                  alt=""
                  width={16}
                  height={16}
                  className="size-4 shrink-0 rounded-sm bg-muted object-contain"
                  loading="lazy"
                />
              ) : (
                <LandmarkIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              )}
              <span className="font-mono font-medium">{option.ticker}</span>
              <span className="truncate text-muted-foreground">{option.name}</span>
              {option.badge && (
                <Badge variant="outline" className="ml-auto">
                  {option.badge}
                </Badge>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
