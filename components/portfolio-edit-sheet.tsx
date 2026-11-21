"use client"

import { useId, useMemo, useRef, useState, type FormEvent } from "react"
import { MinusIcon, PlusIcon, SearchIcon, XIcon } from "lucide-react"

import { type Cedear, formatArs, formatUsd } from "@/lib/cedears"
import { rankPickerResults } from "@/lib/picker-search"
import {
  parseQuantityInput,
  stepQuantity,
  type PortfolioHoldings,
} from "@/lib/portfolio"
import { cn } from "@/lib/utils"
import { TickerLogo } from "@/components/ticker-logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"

const nominalesFormatter = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 6,
})

export function formatNominales(quantity: number): string {
  return `${nominalesFormatter.format(quantity)} nominal${quantity === 1 ? "" : "es"}`
}

/** Editable text for a quantity: no thousands dots, decimal comma. */
function quantityToText(quantity: number): string {
  return quantity > 0 ? String(quantity).replace(".", ",") : ""
}

const NO_SELECTION: ReadonlySet<string> = new Set()
const RESULTS_LIMIT = 50
const POPULAR_LIMIT = 12

export type PortfolioSheetRequest = {
  /** Bumped on every open so the sheet starts from a clean state. */
  id: number
  /** Opens straight at the quantity step for this ticker. */
  ticker: string | null
  /** Prefills the search when there is no ticker. */
  query: string
}

export function PortfolioEditSheet({
  open,
  request,
  onOpenChange,
  cedears,
  holdings,
  mepAverage,
  onSave,
  onRemove,
  finalFocus,
}: {
  finalFocus: () => HTMLElement | null
  open: boolean
  request: PortfolioSheetRequest
  onOpenChange: (open: boolean) => void
  cedears: Cedear[]
  holdings: PortfolioHoldings
  mepAverage: number
  onSave: (ticker: string, quantity: number) => void
  onRemove: (ticker: string) => void
}) {
  return (
    <Sheet open={open} onOpenChange={(next) => onOpenChange(next)}>
      {/* Keyed per open so a reopened sheet never shows the last search or quantity. */}
      <PortfolioSheetBody
        key={request.id}
        request={request}
        cedears={cedears}
        holdings={holdings}
        mepAverage={mepAverage}
        onSave={onSave}
        onRemove={onRemove}
        finalFocus={finalFocus}
      />
    </Sheet>
  )
}

function PortfolioSheetBody({
  request,
  cedears,
  holdings,
  mepAverage,
  onSave,
  onRemove,
  finalFocus,
}: {
  finalFocus: () => HTMLElement | null
  request: PortfolioSheetRequest
  cedears: Cedear[]
  holdings: PortfolioHoldings
  mepAverage: number
  onSave: (ticker: string, quantity: number) => void
  onRemove: (ticker: string) => void
}) {
  const [ticker, setTicker] = useState<string | null>(request.ticker)
  const searchRef = useRef<HTMLInputElement>(null)
  const quantityTitleRef = useRef<HTMLHeadingElement>(null)

  const cedear = useMemo(
    () => (ticker ? cedears.find((c) => c.Cedears === ticker) ?? null : null),
    [cedears, ticker],
  )

  function pick(next: string) {
    setTicker(next)
    // Move focus into the new step without popping the on-screen keyboard.
    requestAnimationFrame(() => quantityTitleRef.current?.focus())
  }

  function change() {
    setTicker(null)
    requestAnimationFrame(() => searchRef.current?.focus())
  }

  return (
    <SheetContent
      side="bottom"
      showCloseButton={false}
      initialFocus={cedear ? quantityTitleRef : searchRef}
      finalFocus={finalFocus}
      data-portfolio-sheet=""
      className={cn(
        "max-h-[90dvh] gap-[var(--space-l)] rounded-t-[var(--radius-xl)] pt-[var(--space-l)] md:mx-auto md:max-w-lg",
        !cedear && "h-[85dvh]",
      )}
    >
      {cedear ? (
        <QuantityStep
          key={cedear.Cedears}
          cedear={cedear}
          initialQuantity={holdings[cedear.Cedears] ?? 0}
          isEditing={(holdings[cedear.Cedears] ?? 0) > 0}
          mepAverage={mepAverage}
          titleRef={quantityTitleRef}
          onChange={change}
          onSave={onSave}
          onRemove={onRemove}
        />
      ) : (
        <PickStep
          cedears={cedears}
          holdings={holdings}
          initialQuery={request.query}
          searchRef={searchRef}
          onPick={pick}
        />
      )}
    </SheetContent>
  )
}

function CloseButton() {
  return (
    <SheetClose
      render={
        <Button
          variant="ghost"
          size="icon"
          className="-mr-[var(--space-s)] size-11 shrink-0 active:bg-muted"
          aria-label="Cerrar"
        />
      }
    >
      <XIcon className="size-5" aria-hidden />
    </SheetClose>
  )
}

function PickStep({
  cedears,
  holdings,
  initialQuery,
  searchRef,
  onPick,
}: {
  cedears: Cedear[]
  holdings: PortfolioHoldings
  initialQuery: string
  searchRef: React.RefObject<HTMLInputElement | null>
  onPick: (ticker: string) => void
}) {
  const [query, setQuery] = useState(initialQuery)
  const listId = useId()

  const options = useMemo(
    () => cedears.map((c) => ({ ticker: c.Cedears, name: c.Name, cedear: c })),
    [cedears],
  )

  const popular = useMemo(
    () =>
      cedears
        .filter((c) => c.volume !== null && c.volume > 0)
        .sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0))
        .slice(0, POPULAR_LIMIT),
    [cedears],
  )

  const trimmed = query.trim()
  const results =
    trimmed === ""
      ? popular
      : rankPickerResults(options, trimmed, NO_SELECTION, RESULTS_LIMIT).map(
          (option) => option.cedear,
        )

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const first = results[0]
    if (trimmed !== "" && first) onPick(first.Cedears)
  }

  return (
    <>
      <div className="flex items-center justify-between gap-[var(--space-s)]">
        <SheetTitle className="text-[length:var(--size-l)] leading-[var(--line-l)] font-semibold">
          Agregar CEDEAR
        </SheetTitle>
        <CloseButton />
      </div>
      <SheetDescription className="sr-only">
        Buscá el CEDEAR por ticker o nombre y elegilo para cargar tus nominales.
      </SheetDescription>

      <form role="search" onSubmit={handleSubmit} className="relative">
        <SearchIcon
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          ref={searchRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ticker o nombre, p. ej. NVDA"
          aria-label="Buscar CEDEAR por ticker o nombre"
          aria-controls={listId}
          className="portfolio-sheet-search h-12 pl-9"
        />
      </form>

      <div className="flex min-h-0 flex-1 flex-col gap-[var(--space-xs)]">
        <p
          className="text-[length:var(--size-s)] leading-[var(--line-s)] text-muted-foreground"
          aria-live="polite"
        >
          {trimmed === ""
            ? "Más operados hoy"
            : results.length === 0
              ? `No encontramos CEDEARs para “${trimmed}”.`
              : `${results.length}${results.length === RESULTS_LIMIT ? "+" : ""} resultado${results.length === 1 ? "" : "s"}`}
        </p>
        <ul
          id={listId}
          aria-label="Resultados"
          className="portfolio-sheet-list -mx-[var(--space-s)] min-h-0 flex-1 overflow-y-auto"
        >
          {results.map((c) => {
            const held = holdings[c.Cedears] ?? 0
            return (
              <li key={c.Cedears}>
                <button
                  type="button"
                  onClick={() => onPick(c.Cedears)}
                  className="flex min-h-14 w-full items-center gap-[var(--space-m)] rounded-[var(--radius-s)] px-[var(--space-s)] py-[var(--space-xs)] text-left transition-colors duration-[var(--motion-duration)] hover:bg-muted/60 active:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--gui-color-1)]"
                >
                  <TickerLogo ticker={c.TickerOriginal} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-mono text-[length:var(--size-m)] leading-[var(--line-m)] font-medium">
                      {c.Cedears}
                    </span>
                    <span className="truncate text-[length:var(--size-s)] leading-[var(--line-s)] text-muted-foreground">
                      {held > 0 ? `En tu portfolio · ${formatNominales(held)}` : c.Name}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-[length:var(--size-s)] leading-[var(--line-s)] tabular-nums text-muted-foreground">
                    {formatArs(c.price)}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </>
  )
}

function QuantityStep({
  cedear,
  initialQuantity,
  isEditing: isEditingProp,
  mepAverage,
  titleRef,
  onChange,
  onSave,
  onRemove,
}: {
  cedear: Cedear
  initialQuantity: number
  isEditing: boolean
  mepAverage: number
  titleRef: React.RefObject<HTMLHeadingElement | null>
  onChange: () => void
  onSave: (ticker: string, quantity: number) => void
  onRemove: (ticker: string) => void
}) {
  const [text, setText] = useState(() => quantityToText(initialQuantity))
  // Frozen at mount: saving updates holdings while the sheet animates out,
  // and the buttons must not change under the user's finger.
  const [isEditing] = useState(isEditingProp)
  const inputId = useId()
  const hintId = useId()

  const quantity = parseQuantityInput(text)
  const valid = quantity !== null && quantity > 0
  const valueArs =
    quantity !== null && cedear.price !== null ? quantity * cedear.price : null
  const valueMep =
    valueArs !== null && mepAverage > 0 ? valueArs / mepAverage : null

  function step(delta: number) {
    setText(quantityToText(stepQuantity(quantity ?? 0, delta)))
  }

  function save(e?: FormEvent) {
    e?.preventDefault()
    if (quantity === null || quantity <= 0) return
    onSave(cedear.Cedears, quantity)
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-[var(--space-l)]">
      <div className="flex items-center gap-[var(--space-m)]">
        <TickerLogo ticker={cedear.TickerOriginal} className="size-11" />
        <div className="flex min-w-0 flex-1 flex-col">
          <SheetTitle
            ref={titleRef}
            tabIndex={-1}
            className="font-mono text-[length:var(--size-l)] leading-[var(--line-l)] font-medium outline-none"
          >
            <span className="sr-only">{isEditing ? "Editar " : "Agregar "}</span>
            {cedear.Cedears}
          </SheetTitle>
          <SheetDescription className="line-clamp-2 text-[length:var(--size-m)] leading-[var(--line-m)]">
            {cedear.Name}{" "}
            <span className="whitespace-nowrap">· {formatArs(cedear.price)}</span>
          </SheetDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-11 shadow-[inset_0_0_0_1px_var(--border)] text-[length:var(--size-m)] active:bg-muted"
          onClick={onChange}
          aria-label={`Cambiar CEDEAR (ahora ${cedear.Cedears})`}
        >
          Cambiar
        </Button>
        <CloseButton />
      </div>

      <div className="flex flex-col gap-[var(--space-s)]">
        <label
          htmlFor={inputId}
          className="text-[length:var(--size-m)] leading-[var(--line-m)] font-medium"
        >
          Nominales
        </label>
        <div className="flex gap-[var(--space-s)]">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="size-14 shrink-0 rounded-[var(--radius-m)] active:bg-neutral-4"
            aria-label="Restar un nominal"
            aria-controls={inputId}
            disabled={(quantity ?? 0) <= 0}
            onClick={() => step(-1)}
          >
            <MinusIcon className="size-5" aria-hidden />
          </Button>
          <Input
            id={inputId}
            type="text"
            inputMode="decimal"
            enterKeyHint="done"
            autoComplete="off"
            placeholder="0"
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-invalid={quantity === null || undefined}
            aria-describedby={hintId}
            className="portfolio-qty-input h-14 flex-1 rounded-[var(--radius-m)] text-center font-mono font-medium tabular-nums"
          />
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="size-14 shrink-0 rounded-[var(--radius-m)] active:bg-neutral-4"
            aria-label="Sumar un nominal"
            aria-controls={inputId}
            onClick={() => step(1)}
          >
            <PlusIcon className="size-5" aria-hidden />
          </Button>
        </div>
        <p
          id={hintId}
          className={cn(
            "text-[length:var(--size-s)] leading-[var(--line-s)]",
            quantity === null ? "text-destructive" : "sr-only",
          )}
        >
          {quantity === null
            ? "Ingresá un número de nominales, por ejemplo 10."
            : "Cantidad de CEDEARs que tenés."}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-[var(--space-s)]" aria-live="polite">
        <div className="flex flex-col gap-[var(--space-xxs)] rounded-[var(--radius-m)] p-[var(--space-m)] shadow-[inset_0_0_0_1px_var(--border)]">
          <dt className="text-[length:var(--size-s)] leading-[var(--line-s)] text-muted-foreground">
            Valor en pesos
          </dt>
          <dd className="truncate font-mono text-[length:var(--size-m)] leading-[var(--line-m)] font-medium tabular-nums">
            {formatArs(valueArs)}
          </dd>
        </div>
        <div className="flex flex-col gap-[var(--space-xxs)] rounded-[var(--radius-m)] p-[var(--space-m)] shadow-[inset_0_0_0_1px_var(--border)]">
          <dt className="text-[length:var(--size-s)] leading-[var(--line-s)] text-muted-foreground">
            Valor al MEP
          </dt>
          <dd className="truncate font-mono text-[length:var(--size-m)] leading-[var(--line-m)] font-medium tabular-nums">
            {formatUsd(valueMep)}
          </dd>
        </div>
      </dl>

      <div className="flex flex-col gap-[var(--space-xxs)]">
        <Button
          type="submit"
          disabled={!valid}
          className="h-13 w-full rounded-[var(--radius-m)] text-[length:var(--size-m)] font-semibold"
        >
          Guardar
        </Button>
        {isEditing && (
          <Button
            type="button"
            variant="ghost"
            className="h-12 w-full rounded-[var(--radius-m)] text-[length:var(--size-m)] text-destructive hover:bg-destructive/10 active:bg-destructive/10"
            onClick={() => onRemove(cedear.Cedears)}
          >
            Quitar del portfolio
          </Button>
        )}
      </div>
    </form>
  )
}
