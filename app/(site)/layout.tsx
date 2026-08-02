import { SiteShell } from "@/components/site-shell"

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-8 px-4 py-10 md:py-16">
      <SiteShell>{children}</SiteShell>
    </main>
  )
}
