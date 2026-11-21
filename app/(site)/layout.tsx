import { SiteShell } from "@/components/site-shell"

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-[var(--space-xxl)] px-[max(var(--space-l),env(safe-area-inset-left,0px),env(safe-area-inset-right,0px))] pt-[max(var(--space-l),env(safe-area-inset-top,0px))] pb-[calc(max(var(--space-xxl),env(safe-area-inset-bottom,0px))+var(--bottom-nav-height,0px))] md:py-16">
      <SiteShell>{children}</SiteShell>
    </main>
  )
}
