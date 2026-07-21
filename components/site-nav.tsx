"use client"

import { useState } from "react"
import Link from "next/link"
import { MenuIcon } from "lucide-react"

import { cn } from "@/lib/utils"
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

export function SiteNav({ currentPath }: { currentPath: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Desktop: enlaces horizontales */}
      <nav aria-label="Secciones" className="hidden flex-wrap gap-2 md:flex">
        {links.map((link) => {
          const isActive = isLinkActive(currentPath, link.href)

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

      {/* Mobile: botón de menú */}
      <div className="md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button variant="outline" size="sm" className="gap-2">
                <MenuIcon className="size-4" />
                {activeLabel(currentPath)}
              </Button>
            }
          />
          <SheetContent side="left" className="w-3/4 max-w-xs">
            <SheetHeader>
              <SheetTitle>Secciones</SheetTitle>
            </SheetHeader>
            <nav aria-label="Secciones" className="flex flex-col gap-1 px-2 pb-4">
              {links.map((link) => {
                const isActive = isLinkActive(currentPath, link.href)

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "rounded-md px-3 py-2 text-sm font-medium transition-colors",
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
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
