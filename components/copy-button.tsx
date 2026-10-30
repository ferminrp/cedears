"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

export function CopyButton({
  value,
  label,
  className,
}: {
  value: string
  label: string
  className?: string
}) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle")
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setState("copied")
    } catch {
      setState("error")
    }
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setState("idle"), 2000)
  }

  return (
    <>
      <button
        type="button"
        onClick={copy}
        aria-label={label}
        className={cn(
          "inline-flex min-h-11 min-w-24 shrink-0 touch-manipulation items-center justify-center rounded-[var(--radius-m)] bg-success px-4 text-sm font-medium text-white transition-[box-shadow,background-color] hover:shadow-[var(--shadow-s)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success focus-visible:ring-offset-2",
          className,
        )}
      >
        {state === "copied" ? "✓ Copiado" : state === "error" ? "Copiá a mano" : "Copiar"}
      </button>
      <span aria-live="polite" className="sr-only">
        {state === "copied" ? "Copiado al portapapeles" : state === "error" ? "No se pudo copiar; seleccioná el texto" : ""}
      </span>
    </>
  )
}
