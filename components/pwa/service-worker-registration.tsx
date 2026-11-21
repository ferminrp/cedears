"use client"

import { useEffect } from "react"

/**
 * Registers public/sw.js after the page has loaded, in production builds only
 * (a dev SW would cache Vite modules and fight HMR). `updateViaCache: "none"`
 * plus the no-cache header in public/_headers make every load check for a new SW.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return
    if (!("serviceWorker" in navigator)) return

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => {
          // No SW is a supported state: the site works exactly as before.
        })
    }

    if (document.readyState === "complete") {
      register()
      return
    }
    window.addEventListener("load", register, { once: true })
    return () => window.removeEventListener("load", register)
  }, [])

  return null
}
