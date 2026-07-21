import type { ReactNode } from "react"
import { siteConfig } from "@/lib/site"

const linkClassName =
  "font-medium text-foreground underline underline-offset-4"

export function SiteFooter({ children }: { children: ReactNode }) {
  return (
    <footer className="mt-auto border-t pt-6 text-sm text-muted-foreground">
      {children}
      <p className="mt-2">
        Proyecto open source —{" "}
        <a
          href={siteConfig.githubRepo}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClassName}
        >
          colaborá en GitHub
        </a>
        .
      </p>
    </footer>
  )
}

export { linkClassName as footerLinkClassName }
