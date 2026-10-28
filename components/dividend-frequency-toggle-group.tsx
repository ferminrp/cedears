"use client"

import { useEffect, useState } from "react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

const FREQUENCY_OPTIONS = [
  { value: "todas", label: "Todas" },
  { value: "mensual", label: "Mensual" },
  { value: "trimestral", label: "Trimestral" },
  { value: "semestral-anual", label: "Semestral/Anual" },
] as const

export function DividendFrequencyToggleGroup({
  value,
  onValueChange,
}: {
  value: string
  onValueChange: (value: string) => void
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div
        className="flex w-max max-w-full flex-nowrap gap-2 overflow-x-auto pb-1"
        aria-hidden
      >
        {FREQUENCY_OPTIONS.map((option) => (
          <span
            key={option.value}
            className="inline-flex min-h-11 shrink-0 items-center rounded-lg border border-input px-3 text-sm"
          >
            {option.label}
          </span>
        ))}
      </div>
    )
  }

  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(values) => {
        onValueChange(values[0] ?? "todas")
      }}
      aria-label="Filtrar por frecuencia"
      variant="outline"
      size="sm"
      className="flex w-max max-w-full flex-nowrap gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {FREQUENCY_OPTIONS.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          className="min-h-11 shrink-0"
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
