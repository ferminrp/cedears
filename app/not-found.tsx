import { SiteShell } from "@/components/site-shell"
import NotFoundContent from "@/components/not-found-content"

export default function RootNotFound() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-8 px-4 py-10 md:py-16">
      <SiteShell>
        <NotFoundContent />
      </SiteShell>
    </main>
  )
}
