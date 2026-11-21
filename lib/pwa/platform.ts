/**
 * Browser capability checks for the install flow. Client-only (touches
 * navigator / matchMedia); every function is safe to call during SSR and
 * returns false there.
 */

type NavigatorWithStandalone = Navigator & { standalone?: boolean }

/** Running as an installed app (Android/desktop display-mode or iOS home-screen web app). */
export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false
  const nav = navigator as NavigatorWithStandalone
  if (nav.standalone === true) return true
  return ["standalone", "fullscreen", "minimal-ui"].some(
    (mode) => window.matchMedia?.(`(display-mode: ${mode})`).matches,
  )
}

/**
 * iOS/iPadOS WebKit, in a browser tab, where the only install path is
 * Compartir → Agregar a inicio (there is no beforeinstallprompt).
 *
 * Capability check instead of UA sniffing: only WebKit on iOS/iPadOS exposes
 * `navigator.standalone` (false in a tab, true once installed), and touch
 * points rule out desktop WebKit. This is the single place that decides it.
 */
export function canAddToHomeScreenIos(): boolean {
  if (typeof navigator === "undefined") return false
  const nav = navigator as NavigatorWithStandalone
  return "standalone" in nav && nav.standalone === false && nav.maxTouchPoints > 0
}
