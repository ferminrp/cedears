"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"
import { CheckIcon } from "lucide-react"

import { AppMark } from "@/components/pwa/app-mark"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  INSTALL_DISMISSED_AT_KEY,
  INSTALL_VISIT_COUNTED_SESSION_KEY,
  INSTALL_VISITS_KEY,
  parseStoredInt,
  resolveInstallMethod,
  shouldShowInstallNudge,
  type InstallMethod,
} from "@/lib/pwa/install-eligibility"
import { canAddToHomeScreenIos, isStandaloneDisplay } from "@/lib/pwa/platform"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

const NUDGE_SHOWN_SESSION_KEY = "cedears.pwa.nudge-shown"
const NUDGE_DELAY_MS = 3000
/** The nudge belongs to the mobile layout (the "Más" entry is mobile-only too). */
const MOBILE_QUERY = "(max-width: 47.999rem)"

// Captured at module evaluation, before hydration, so an early
// beforeinstallprompt is not lost. preventDefault keeps Chrome's mini-infobar
// away; the app offers its own entry instead.
let deferredPrompt: BeforeInstallPromptEvent | null = null
let installedThisSession = false
const subscribers = new Set<() => void>()
const notify = () => subscribers.forEach((fn) => fn())

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault()
    deferredPrompt = event as BeforeInstallPromptEvent
    notify()
  })
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null
    installedThisSession = true
    notify()
  })
}

function subscribe(fn: () => void) {
  subscribers.add(fn)
  return () => {
    subscribers.delete(fn)
  }
}

function readStorage(storage: "local" | "session", key: string): string | null {
  try {
    return (storage === "local" ? window.localStorage : window.sessionStorage).getItem(key)
  } catch {
    return null
  }
}

function writeStorage(storage: "local" | "session", key: string, value: string) {
  try {
    ;(storage === "local" ? window.localStorage : window.sessionStorage).setItem(key, value)
  } catch {
    // Private mode / blocked storage: the nudge just won't be remembered.
  }
}

type InstallContextValue = {
  /** How "Instalar la app" installs here, or null when it should be hidden. */
  method: InstallMethod
  openInstall: () => void
}

const InstallContext = createContext<InstallContextValue>({
  method: null,
  openInstall: () => {},
})

export function useInstall() {
  return useContext(InstallContext)
}

export function InstallProvider({ children }: { children: React.ReactNode }) {
  const hasDeferredPrompt = useSyncExternalStore(
    subscribe,
    () => deferredPrompt !== null,
    () => false,
  )
  const installed = useSyncExternalStore(
    subscribe,
    () => installedThisSession,
    () => false,
  )
  const [env, setEnv] = useState({ standalone: false, ios: false })
  const [open, setOpen] = useState(false)
  const source = useRef<"menu" | "nudge">("menu")

  useEffect(() => {
    setEnv({ standalone: isStandaloneDisplay(), ios: canAddToHomeScreenIos() })

    // One visit per browser session.
    if (!readStorage("session", INSTALL_VISIT_COUNTED_SESSION_KEY)) {
      const visits = parseStoredInt(readStorage("local", INSTALL_VISITS_KEY)) ?? 0
      writeStorage("local", INSTALL_VISITS_KEY, String(visits + 1))
      writeStorage("session", INSTALL_VISIT_COUNTED_SESSION_KEY, "1")
    }
  }, [])

  const method = installed
    ? null
    : resolveInstallMethod({
        standalone: env.standalone,
        hasDeferredPrompt,
        iosAddToHomeScreen: env.ios,
      })

  // Automatic nudge: Chromium only (needs the deferred prompt), from the second visit.
  useEffect(() => {
    if (!hasDeferredPrompt || env.standalone) return
    const eligible = shouldShowInstallNudge({
      visits: parseStoredInt(readStorage("local", INSTALL_VISITS_KEY)) ?? 0,
      dismissedAt: parseStoredInt(readStorage("local", INSTALL_DISMISSED_AT_KEY)),
      now: Date.now(),
      standalone: env.standalone,
      hasDeferredPrompt,
      shownThisSession: readStorage("session", NUDGE_SHOWN_SESSION_KEY) === "1",
    })
    if (!eligible || !window.matchMedia(MOBILE_QUERY).matches) return
    const id = window.setTimeout(() => {
      if (!deferredPrompt) return
      writeStorage("session", NUDGE_SHOWN_SESSION_KEY, "1")
      source.current = "nudge"
      setOpen(true)
    }, NUDGE_DELAY_MS)
    return () => window.clearTimeout(id)
  }, [hasDeferredPrompt, env.standalone])

  const openInstall = useCallback(() => {
    source.current = "menu"
    setOpen(true)
  }, [])

  const dismiss = useCallback(() => {
    writeStorage("local", INSTALL_DISMISSED_AT_KEY, String(Date.now()))
    setOpen(false)
  }, [])

  const onOpenChange = useCallback(
    (next: boolean) => {
      // Closing the automatic nudge any way (X, backdrop, Esc) counts as "Ahora no".
      if (!next && source.current === "nudge") {
        writeStorage("local", INSTALL_DISMISSED_AT_KEY, String(Date.now()))
      }
      setOpen(next)
    },
    [],
  )

  const install = useCallback(async () => {
    const event = deferredPrompt
    if (!event) {
      setOpen(false)
      return
    }
    // A deferred prompt can only be used once.
    deferredPrompt = null
    notify()
    try {
      await event.prompt()
      const choice = await event.userChoice
      if (choice.outcome === "dismissed") {
        writeStorage("local", INSTALL_DISMISSED_AT_KEY, String(Date.now()))
      }
    } catch {
      // prompt() throws if the browser withdrew it; nothing else to do.
    }
    setOpen(false)
  }, [])

  const value = useMemo(() => ({ method, openInstall }), [method, openInstall])
  // Keep the last method while the sheet animates out after prompt() clears it.
  const lastMethod = useRef<InstallMethod>(null)
  if (method) lastMethod.current = method
  const sheetMethod = method ?? lastMethod.current

  return (
    <InstallContext.Provider value={value}>
      {children}
      {sheetMethod ? (
        <InstallSheet
          open={open}
          onOpenChange={onOpenChange}
          method={sheetMethod}
          onInstall={install}
          onDismiss={dismiss}
        />
      ) : null}
    </InstallContext.Provider>
  )
}

function InstallSheet({
  open,
  onOpenChange,
  method,
  onInstall,
  onDismiss,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  method: Exclude<InstallMethod, null>
  onInstall: () => void
  onDismiss: () => void
}) {
  const benefits = [
    // start_url is "/" for Chromium installs; iOS may keep the page you add it from.
    method === "prompt"
      ? "Abre directo en el listado, a pantalla completa."
      : "Se abre a pantalla completa, como una app.",
    "Las páginas que ya abriste, como tu portfolio, se ven sin conexión con el último precio guardado.",
    // Manifest shortcuts are an Android/Chromium feature; iOS has no icon menu for web apps.
    ...(method === "prompt"
      ? ["Accesos directos a Portfolio y Dólar MEP desde el ícono."]
      : []),
  ]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="pwa-sheet mx-auto max-w-lg gap-[var(--space-xl)] rounded-t-[var(--radius-xl)]"
      >
        <span aria-hidden="true" className="mx-auto h-1 w-10 rounded-full bg-neutral-5" />
        <div className="flex items-center gap-[var(--space-l)]">
          <AppMark />
          <div className="flex min-w-0 flex-col gap-[var(--space-xxs)]">
            <SheetTitle className="text-[length:var(--size-l)] leading-[var(--line-l)] font-semibold">
              Instalá CEDEARs
            </SheetTitle>
            <SheetDescription className="text-[length:var(--size-m)] leading-[var(--line-m)]">
              cedears.com · gratis, sin cuenta
            </SheetDescription>
          </div>
        </div>

        <ul className="flex flex-col gap-[var(--space-m)]">
          {benefits.map((text) => (
            <li key={text} className="flex items-start gap-[var(--space-m)]">
              <CheckIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-positive-text" />
              <span className="text-[length:var(--size-m)] leading-[var(--line-m)] text-pretty">{text}</span>
            </li>
          ))}
        </ul>

        {method === "prompt" ? (
          <div className="flex flex-col gap-[var(--space-xxs)]">
            <Button size="lg" className="min-h-12 w-full" onClick={onInstall}>
              Instalar
            </Button>
            <Button variant="ghost" size="lg" className="min-h-12 w-full" onClick={onDismiss}>
              Ahora no
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-[var(--space-xxs)]">
            <ol className="flex flex-col gap-[var(--space-m)] rounded-[var(--radius-l)] bg-muted p-[var(--space-l)]">
              <li className="flex items-center gap-[var(--space-m)]">
                <StepNumber n={1} />
                <span className="text-[length:var(--size-m)] leading-[var(--line-m)]">
                  Tocá <strong className="font-semibold">Compartir</strong> en la barra de Safari.
                </span>
              </li>
              <li className="flex items-center gap-[var(--space-m)]">
                <StepNumber n={2} />
                <span className="text-[length:var(--size-m)] leading-[var(--line-m)]">
                  Elegí <strong className="font-semibold">Agregar a inicio</strong>.
                </span>
              </li>
            </ol>
            <Button variant="ghost" size="lg" className="min-h-12 w-full" onClick={() => onOpenChange(false)}>
              Entendido
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function StepNumber({ n }: { n: number }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[length:var(--size-m)] font-semibold text-primary-foreground"
    >
      {n}
    </span>
  )
}
