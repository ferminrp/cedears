"use client"

import { useState } from "react"
import { useLinkStatus } from "next/link"
import { usePathname } from "next/navigation"
import { MenuIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { useNavPending } from "@/components/nav-pending"
import { SiteLink } from "@/components/site-link"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const links = [
  { href: "/", label: "Listado" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/categorias", label: "Categorías" },
  { href: "/herramientas", label: "Herramientas" },
  { href: "/alycs", label: "ALyCs" },
  { href: "/dolar-mep", label: "Dólar MEP" },
  { href: "/dolar-cable", label: "Dólar cable" },
  { href: "/earnings", label: "Earnings" },
] as const

const isLinkActive = (currentPath: string, href: string) =>
  href === "/"
    ? currentPath === "/"
    : currentPath === href || currentPath.startsWith(`${href}/`)

const activeLabel = (currentPath: string) =>
  links.find((link) => isLinkActive(currentPath, link.href))?.label ?? "Menú"

function NavLinkLabel({ label }: { label: string }) {
  const { pending } = useLinkStatus()

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        pending && "animate-pulse opacity-70",
      )}
      aria-busy={pending || undefined}
    >
      {label}
      {pending ? <span className="sr-only">Cargando</span> : null}
    </span>
  )
}

function NavLink({
  href,
  label,
  className,
  onNavigate,
}: {
  href: string
  label: string
  className?: string
  onNavigate?: () => void
}) {
  const pathname = usePathname() ?? "/"
  const { pendingHref } = useNavPending()
  const isActive = isLinkActive(pathname, href)
  const isPendingTarget = pendingHref === href

  return (
    <SiteLink
      href={href}
      aria-current={isActive ? "page" : undefined}
      aria-busy={isPendingTarget || undefined}
      onNavigate={() => {
        onNavigate?.()
      }}
      className={cn(
        "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        isActive || isPendingTarget
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        isPendingTarget && "animate-pulse",
        className,
      )}
    >
      <NavLinkLabel label={label} />
    </SiteLink>
  )
}

export function SiteNav() {
  const pathname = usePathname() ?? "/"
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Desktop: enlaces horizontales */}
      <nav aria-label="Secciones" className="hidden flex-wrap gap-2 md:flex">
        {links.map((link) => (
          <NavLink key={link.href} href={link.href} label={link.label} />
        ))}
      </nav>

      {/* Mobile: botón de menú */}
      <div className="md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button variant="outline" size="sm" className="gap-2">
                <MenuIcon className="size-4" />
                {activeLabel(pathname)}
              </Button>
            }
          />
          <SheetContent side="left" className="w-3/4 max-w-xs">
            <SheetHeader>
              <SheetTitle>Secciones</SheetTitle>
            </SheetHeader>
            <nav aria-label="Secciones" className="flex flex-col gap-1 px-2 pb-4">
              {links.map((link) => (
                <NavLink
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  className="px-3 py-2"
                  onNavigate={() => setOpen(false)}
                />
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
