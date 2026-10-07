import { SiteShell } from "@/components/site-shell"

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-[var(--space-xxl)] px-[var(--space-l)] py-[var(--space-xxl)] md:py-16">
      <SiteShell>{children}</SiteShell>
    </main>
  )
}
