import Link from "next/link"
import { cn } from "@/lib/utils"

const links = [
  { href: "/", label: "Listado" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/dolar-mep", label: "Dólar MEP" },
  { href: "/dolar-cable", label: "Dólar cable" },
  { href: "/earnings", label: "Earnings" },
] as const

export function SiteNav({ currentPath }: { currentPath: string }) {
  return (
    <nav aria-label="Secciones" className="flex flex-wrap gap-2">
      {links.map((link) => {
        const isActive = currentPath === link.href

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
