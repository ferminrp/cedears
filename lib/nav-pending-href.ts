export type HrefLike = string | { pathname?: string | null }

export function pathFromHref(href: HrefLike): string {
  if (typeof href === "string") {
    const queryIndex = href.indexOf("?")
    const hashIndex = href.indexOf("#")
    let end = href.length
    if (queryIndex >= 0) end = Math.min(end, queryIndex)
    if (hashIndex >= 0) end = Math.min(end, hashIndex)
    return href.slice(0, end) || "/"
  }

  return href.pathname || "/"
}

export function pendingMatchesPath({
  pendingHref,
  pathname,
}: {
  pendingHref: string
  pathname: string
}): boolean {
  if (pendingHref === "/") return pathname === "/"
  return pathname === pendingHref || pathname.startsWith(`${pendingHref}/`)
}
