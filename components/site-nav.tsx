"use client"

import { useEffect, useState } from "react"
import Link, { useLinkStatus } from "next/link"
import { usePathname } from "next/navigation"
import {
  CalculatorIcon,
  ChartPieIcon,
  ChevronRightIcon,
  DollarSignIcon,
  EllipsisIcon,
  ListIcon,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useNavPending } from "@/components/nav-pending"
import { useInstall } from "@/components/pwa/install-provider"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

const links = [
  { href: "/", label: "Listado" },
  { href: "/nuevos-cedears", label: "Nuevos" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/categorias", label: "Categorías" },
  { href: "/ratios", label: "Ratios" },
  { href: "/herramientas", label: "Herramientas" },
  { href: "/alycs", label: "ALyCs" },
  { href: "/dolar-mep", label: "Dólar MEP" },
  { href: "/dolar-cable", label: "Dólar cable" },
  { href: "/earnings", label: "Earnings" },
  { href: "/dividendos", label: "Dividendos" },
] as const

const isLinkActive = (currentPath: string, href: string) =>
  href === "/"
    ? currentPath === "/"
    : currentPath === href || currentPath.startsWith(`${href}/`)

const matchesAny = (currentPath: string, hrefs: readonly string[]) =>
  hrefs.some((href) => isLinkActive(currentPath, href))

/** Mobile tab bar (< md). `match` lists every section that lights the tab up. */
const tabs: readonly {
  href: string
  label: string
  icon: LucideIcon
  match: readonly string[]
}[] = [
  // CEDEAR detail pages hang off the listing.
  { href: "/", label: "Listado", icon: ListIcon, match: ["/", "/cedear"] },
  { href: "/portfolio", label: "Portfolio", icon: ChartPieIcon, match: ["/portfolio"] },
  { href: "/dolar-mep", label: "Dólar", icon: DollarSignIcon, match: ["/dolar-mep", "/dolar-cable"] },
  { href: "/herramientas", label: "Calcular", icon: CalculatorIcon, match: ["/herramientas", "/ratios"] },
]

/** Sections that live behind "Más" (grouped as in the approved mockup). */
const moreGroups: readonly {
  title: string
  items: readonly { href: string; label: string; hint: string }[]
}[] = [
  {
    title: "Explorar",
    items: [
      { href: "/nuevos-cedears", label: "Nuevos", hint: "Últimos CEDEARs listados en BYMA" },
      { href: "/categorias", label: "Categorías", hint: "CEDEARs agrupados por temática" },
      { href: "/earnings", label: "Earnings", hint: "Calendario de balances" },
      { href: "/dividendos", label: "Dividendos", hint: "Próximos pagos y frecuencia" },
      { href: "/ratios", label: "Ratios", hint: "Ratios de conversión de cada CEDEAR" },
      { href: "/dolar-cable", label: "Dólar cable", hint: "CCL implícito en CEDEARs" },
    ],
  },
  {
    title: "Operar",
    items: [{ href: "/alycs", label: "ALyCs", hint: "Comisiones y tarifarios para operar" }],
  },
  {
    title: "Datos y app",
    items: [{ href: "/mcp", label: "MCP y descargas", hint: "Para agentes de IA, CSV y Markdown" }],
  },
]

const moreMatch = ["/nuevos-cedears", "/categorias", "/categoria", "/earnings", "/dividendos", "/alycs", "/mcp"] as const

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

/** Shared pending bookkeeping for every nav link (desktop, tab bar, Más). */
function usePendingNav(href: string) {
  const pathname = usePathname() ?? "/"
  const { pendingHref, setPendingHref } = useNavPending()
  return {
    pathname,
    isPendingTarget: pendingHref === href,
    markPending: () => {
      if (href !== pathname) {
        setPendingHref(href)
      }
    },
  }
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
  const { pathname, isPendingTarget, markPending } = usePendingNav(href)
  const isActive = isLinkActive(pathname, href)

  return (
    <Link
      href={href}
      prefetch={true}
      aria-current={isActive ? "page" : undefined}
      aria-busy={isPendingTarget || undefined}
      onNavigate={() => {
        markPending()
        onNavigate?.()
      }}
      className={cn(
        "inline-flex min-h-11 items-center rounded-[var(--radius-s)] px-[var(--space-m)] py-[var(--space-xs)] text-[length:var(--size-s)] leading-[var(--line-s)] font-medium transition-colors duration-[var(--motion-duration)] ease-[var(--motion-easing)]",
        isActive || isPendingTarget
          ? "bg-navigation-active text-navigation-active-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        isPendingTarget && "animate-pulse",
        className,
      )}
    >
      <NavLinkLabel label={label} />
    </Link>
  )
}

const tabItemClassName =
  "bottom-tab flex min-h-12 min-w-0 flex-col items-center justify-center gap-[var(--space-xxs)] rounded-[var(--radius-m)] text-[length:var(--size-xs)] leading-[var(--line-xs)] transition-[color,opacity,transform] duration-[var(--motion-duration)] ease-[var(--motion-easing)]"

function TabLink({ tab }: { tab: (typeof tabs)[number] }) {
  const { pathname, isPendingTarget, markPending } = usePendingNav(tab.href)
  const isActive = matchesAny(pathname, tab.match)
  const Icon = tab.icon
  const highlighted = isActive || isPendingTarget

  return (
    <Link
      href={tab.href}
      prefetch={true}
      aria-current={isActive ? "page" : undefined}
      aria-busy={isPendingTarget || undefined}
      onNavigate={markPending}
      className={cn(
        tabItemClassName,
        highlighted ? "font-semibold text-foreground" : "font-medium text-muted-foreground",
        isPendingTarget && "animate-pulse",
      )}
    >
      <Icon aria-hidden="true" className="size-[22px]" strokeWidth={highlighted ? 2.4 : 2} />
      <NavLinkLabel label={tab.label} />
    </Link>
  )
}

function MoreLink({
  href,
  label,
  hint,
  onNavigate,
}: {
  href: string
  label: string
  hint: string
  onNavigate: () => void
}) {
  const { pathname, isPendingTarget, markPending } = usePendingNav(href)
  const isActive = isLinkActive(pathname, href)

  return (
    <Link
      href={href}
      prefetch={true}
      aria-current={isActive ? "page" : undefined}
      aria-busy={isPendingTarget || undefined}
      onNavigate={() => {
        markPending()
        onNavigate()
      }}
      className="more-row flex min-h-14 items-center gap-[var(--space-m)] px-[var(--space-l)] py-[var(--space-s)]"
    >
      <span className="flex min-w-0 flex-1 flex-col">
        <span
          className={cn(
            "text-[length:var(--size-m)] leading-[var(--line-m)]",
            isActive ? "font-semibold" : "font-medium",
          )}
        >
          <NavLinkLabel label={label} />
        </span>
        <span className="text-[length:var(--size-s)] leading-[var(--line-s)] text-muted-foreground">
          {hint}
        </span>
      </span>
      <ChevronRightIcon aria-hidden="true" className="size-[18px] shrink-0 text-muted-foreground" />
    </Link>
  )
}

function MoreButtonRow({
  label,
  hint,
  onClick,
}: {
  label: string
  hint: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="more-row flex min-h-14 w-full items-center gap-[var(--space-m)] px-[var(--space-l)] py-[var(--space-s)] text-left"
    >
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[length:var(--size-m)] leading-[var(--line-m)] font-medium">{label}</span>
        <span className="text-[length:var(--size-s)] leading-[var(--line-s)] text-muted-foreground">
          {hint}
        </span>
      </span>
      <ChevronRightIcon aria-hidden="true" className="size-[18px] shrink-0 text-muted-foreground" />
    </button>
  )
}

function MobileTabBar() {
  const pathname = usePathname() ?? "/"
  const [moreOpen, setMoreOpen] = useState(false)
  const { pendingHref } = useNavPending()
  const install = useInstall()

  // Backstop: any navigation (incl. back/forward) closes the Más sheet.
  useEffect(() => {
    setMoreOpen(false)
  }, [pathname])

  const moreActive =
    moreOpen ||
    matchesAny(pathname, moreMatch) ||
    (pendingHref !== null && matchesAny(pendingHref, moreMatch))

  return (
    <>
      <nav aria-label="Secciones principales" className="bottom-tab-bar md:hidden print:hidden">
        {tabs.map((tab) => (
          <TabLink key={tab.href} tab={tab} />
        ))}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
          className={cn(
            tabItemClassName,
            moreActive ? "font-semibold text-foreground" : "font-medium text-muted-foreground",
          )}
        >
          <EllipsisIcon aria-hidden="true" className="size-[22px]" strokeWidth={moreActive ? 2.8 : 2.4} />
          <span>Más</span>
        </button>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="pwa-sheet mx-auto max-h-[85dvh] max-w-lg gap-[var(--space-l)] overflow-y-auto rounded-t-[var(--radius-xl)]"
        >
          <SheetHeader>
            <SheetTitle className="text-[length:var(--size-l)] leading-[var(--line-l)] font-semibold">
              Más
            </SheetTitle>
          </SheetHeader>
          <nav aria-label="Más secciones" className="flex flex-col gap-[var(--space-l)]">
            {moreGroups.map((group) => {
              const showInstall = group.title === "Datos y app" && install.method !== null
              return (
                <section key={group.title} className="flex flex-col gap-[var(--space-xs)]">
                  <h2 className="text-[length:var(--size-s)] leading-[var(--line-s)] font-semibold text-muted-foreground">
                    {group.title}
                  </h2>
                  <div className="more-group overflow-hidden rounded-[var(--radius-l)] bg-muted">
                    {group.items.map((item) => (
                      <MoreLink
                        key={item.href}
                        href={item.href}
                        label={item.label}
                        hint={item.hint}
                        onNavigate={() => setMoreOpen(false)}
                      />
                    ))}
                    {showInstall ? (
                      <MoreButtonRow
                        label="Instalar la app"
                        hint="Acceso directo en tu pantalla de inicio"
                        onClick={() => {
                          setMoreOpen(false)
                          install.openInstall()
                        }}
                      />
                    ) : null}
                  </div>
                </section>
              )
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  )
}

export function SiteNav() {
  return (
    <>
      {/* Desktop: enlaces horizontales. Also the server-rendered link list
          crawlers follow on every viewport (hidden with CSS below md). */}
      <nav aria-label="Secciones" className="hidden flex-wrap gap-2 md:flex">
        {links.map((link) => (
          <NavLink key={link.href} href={link.href} label={link.label} />
        ))}
      </nav>

      {/* Mobile: barra de pestañas fija abajo */}
      <MobileTabBar />
    </>
  )
}
