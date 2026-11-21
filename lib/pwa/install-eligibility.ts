/**
 * Pure rules for the PWA install nudge. Browser glue lives in
 * components/pwa/install-provider.tsx; keep this file free of DOM access so it
 * stays unit-testable.
 */

export const INSTALL_VISITS_KEY = "cedears.pwa.visits"
export const INSTALL_DISMISSED_AT_KEY = "cedears.pwa.install-dismissed-at"
export const INSTALL_VISIT_COUNTED_SESSION_KEY = "cedears.pwa.visit-counted"

/** The automatic nudge comes back at most once every 30 days after a dismissal. */
export const INSTALL_DISMISS_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000

/** First visit never shows the nudge. */
export const INSTALL_MIN_VISITS = 2

export type InstallNudgeInput = {
  /** Sessions counted so far, including the current one. */
  visits: number
  /** Epoch ms of the last dismissal, or null if never dismissed. */
  dismissedAt: number | null
  now: number
  /** Running as an installed app (display-mode: standalone / navigator.standalone). */
  standalone: boolean
  /** A deferred `beforeinstallprompt` event is available. */
  hasDeferredPrompt: boolean
  /** Already shown during this page session. */
  shownThisSession: boolean
}

export function shouldShowInstallNudge(input: InstallNudgeInput): boolean {
  if (input.standalone) return false
  if (!input.hasDeferredPrompt) return false
  if (input.shownThisSession) return false
  if (!Number.isFinite(input.visits) || input.visits < INSTALL_MIN_VISITS) return false
  if (input.dismissedAt !== null && Number.isFinite(input.dismissedAt)) {
    if (input.now - input.dismissedAt < INSTALL_DISMISS_COOLDOWN_MS) return false
  }
  return true
}

export type InstallMethod = "prompt" | "ios" | null

/**
 * Which install path the "Instalar la app" entry should offer.
 * `prompt` = Chromium deferred prompt; `ios` = manual Compartir → Agregar a inicio.
 */
export function resolveInstallMethod(input: {
  standalone: boolean
  hasDeferredPrompt: boolean
  iosAddToHomeScreen: boolean
}): InstallMethod {
  if (input.standalone) return null
  if (input.hasDeferredPrompt) return "prompt"
  if (input.iosAddToHomeScreen) return "ios"
  return null
}

/** Parses a stored integer, tolerating junk written by older versions or users. */
export function parseStoredInt(raw: string | null): number | null {
  if (raw === null) return null
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) ? n : null
}
