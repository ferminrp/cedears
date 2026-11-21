import { cn } from "@/lib/utils"

/**
 * The app icon (black tile, three ascending bars, the tallest in brand red) as
 * markup. Proportions match lib/pwa-icon.tsx so the sheet shows the real icon.
 * Brand colours are fixed: the icon looks the same in light and dark.
 */
export function AppMark({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Ícono de CEDEARs"
      className={cn(
        "relative inline-flex size-16 shrink-0 items-end justify-center gap-[5px] rounded-[15px] bg-[#000000] pb-4 dark:ring-1 dark:ring-border",
        className,
      )}
    >
      <span className="h-3.5 w-2 rounded-[var(--radius-xs)] bg-[#ffffff]" />
      <span className="h-6 w-2 rounded-[var(--radius-xs)] bg-[#ffffff]" />
      <span className="h-8 w-2 rounded-[var(--radius-xs)] bg-[#fc032d]" />
    </span>
  )
}
