import Link from "next/link"

import { cn } from "@/lib/utils"

const options = [
  { href: "/dolar-mep", label: "MEP" },
  { href: "/dolar-cable", label: "Cable (CCL)" },
] as const

/**
 * MEP ↔ cable switch for mobile, where both pages share the "Dólar" tab.
 * Desktop keeps both links in the top nav, so this is hidden from md up.
 */
export function DollarKindSwitch({ current }: { current: "/dolar-mep" | "/dolar-cable" }) {
  return (
    <nav
      aria-label="Tipo de dólar"
      className="grid grid-cols-2 gap-[var(--space-xxs)] rounded-[var(--radius-m)] bg-muted p-[var(--space-xxs)] md:hidden"
    >
      {options.map((option) => {
        const active = option.href === current
        return (
          <Link
            key={option.href}
            href={option.href}
            prefetch={true}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center justify-center rounded-[var(--radius-s)] px-[var(--space-m)] text-[length:var(--size-m)] leading-[var(--line-m)] transition-colors duration-[var(--motion-duration)] ease-[var(--motion-easing)]",
              active
                ? "bg-background font-semibold text-foreground shadow-[var(--shadow-m)]"
                : "font-medium text-muted-foreground",
            )}
          >
            {option.label}
          </Link>
        )
      })}
    </nav>
  )
}
