import Link from "next/link"

import { Button } from "@/components/ui/button"

type BrokerCtaSlotProps = {
  active?: boolean
  href?: string
  label?: string
}

export function BrokerCtaSlot({ active, href, label }: BrokerCtaSlotProps) {
  if (!active || !href?.trim() || !label?.trim()) {
    return null
  }

  return (
    <section
      aria-label="Acción de broker"
      className="rounded-[var(--radius-xl)] border border-border bg-card p-6 shadow-[var(--shadow-s)]"
    >
      <Button
        className="bg-[var(--success)] text-primary-foreground hover:bg-[var(--success)]/90"
        nativeButton={false}
        render={<Link href={href} />}
      >
        {label}
      </Button>
    </section>
  )
}
