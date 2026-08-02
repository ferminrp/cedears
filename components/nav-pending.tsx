"use client"

import { createContext, useContext } from "react"

type NavPendingContextValue = {
  pendingHref: string | null
  setPendingHref: (href: string | null) => void
}

const NavPendingContext = createContext<NavPendingContextValue>({
  pendingHref: null,
  setPendingHref: () => {},
})

export function NavPendingProvider({
  pendingHref,
  setPendingHref,
  children,
}: NavPendingContextValue & {
  children: React.ReactNode
}) {
  return (
    <NavPendingContext.Provider value={{ pendingHref, setPendingHref }}>
      {children}
    </NavPendingContext.Provider>
  )
}

export function useNavPending() {
  return useContext(NavPendingContext)
}
